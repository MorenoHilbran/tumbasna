import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    WAMessageContent,
    WAMessageKey,
    fetchLatestBaileysVersion,
    Browsers,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Import services and handlers
import { processIncomingMessage } from '../handlers/messageHandler';
import { extractText } from '../utils/messageParser';
import { setSock, setStatus, setQR } from '../services/whatsappClient';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3000';

// Upload gambar ke Supabase Storage via dashboard API
async function uploadImageToStorage(buffer: Buffer, filename: string): Promise<string | null> {
    try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', buffer, { filename, contentType: 'image/jpeg' });
        const response = await axios.post(`${API_URL}/api/upload`, form, {
            headers: form.getHeaders(),
        });
        return response.data?.url || null;
    } catch (err: any) {
        console.error('[UPLOAD ERROR] Gagal upload gambar:', err.message);
        return null;
    }
}

// Reverse geocode coordinates to Indonesian address name
async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`, {
            headers: { 'User-Agent': 'TumbasnaApp/1.0' }
        });
        const address = response.data?.address;
        if (address) {
            const village = address.village || address.suburb || address.neighbourhood || '';
            const district = address.suburb || address.city_district || address.district || '';
            const regency = address.city || address.regency || address.county || '';
            
            const parts = [village, district, regency].filter(Boolean);
            if (parts.length > 0) return parts.join(', ');
            return response.data.display_name || `${lat}, ${lng}`;
        }
        return `${lat}, ${lng}`;
    } catch (err: any) {
        console.error('[REVERSE GEO ERROR] Gagal reverse geocode:', err.message);
        return `${lat}, ${lng}`;
    }
}

const logger = pino({ level: 'silent' }); // suppress baileys internal logs

export async function connectWhatsApp() {
    const authDir = path.join(process.cwd(), 'session');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Menggunakan WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger,
        auth: state,
        printQRInTerminal: false, // we handle QR ourselves
        generateHighQualityLinkPreview: true,
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    setSock(sock); // Simpan instance socket ke Singleton Service agar diakses rute API

    // ─── QR Code ──────────────────────────────────────────────
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 Scan QR code di bawah ini dengan WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            setQR(qr);
            setStatus('qr');
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Logged out. Hapus folder session dan restart.');
                setStatus('close');
                setQR(null);
            } else {
                console.log(`⚠️  Disconnected (reason: ${reason}). Reconnecting...`);
                setStatus('connecting');
                connectWhatsApp(); // auto-reconnect
            }
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp connected!\n');
            setStatus('open');
            setQR(null);
        }
    });

    // ─── Save credentials on update ───────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // ─── Message Listener ─────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log(`📬 [NETWORK EVENT] Tipe: ${type}, Jumlah Pesan: ${messages.length}`);
        
        if (type !== 'notify') return;

        for (const msg of messages) {
            const sender = msg.key.remoteJid || 'unknown';
            const text = extractText(msg.message) || '';
            const isFromMe = msg.key.fromMe || false;

            console.log(`📩 [MESSAGE RECEIVED] Dari: ${sender}, Teks: "${text}", fromMe: ${isFromMe}`);

            if (isFromMe) continue; // ignore own messages
            
            const pushName = msg.pushName || 'Unknown';
            const enableRealWA = process.env.ENABLE_REAL_WA === 'true';
            
            // ─── Handle Location Message ─────────────────────────────
            const isLocation = !!msg.message?.locationMessage;
            if (isLocation && enableRealWA && msg.message?.locationMessage) {
                const locMsg = msg.message.locationMessage;
                const lat = locMsg.degreesLatitude;
                const lng = locMsg.degreesLongitude;
                if (typeof lat === 'number' && typeof lng === 'number') {
                    console.log(`📍 [LOCATION] Share lokasi diterima dari ${sender}: Lat=${lat}, Lng=${lng}`);
                    
                    const addressName = await reverseGeocode(lat, lng);
                    console.log(`📍 [LOCATION] Alamat terdeteksi: ${addressName}`);

                    // Buat teks representasi lokasi agar diproses AI
                    const combinedText = `[Supplier mengirim share location] Nama Lokasi: ${addressName} | Lat: ${lat} | Lng: ${lng}`;

                    await processIncomingMessage(
                        sender,
                        pushName,
                        combinedText,
                        (jid, content) => sock.sendMessage(jid, content, { quoted: msg })
                    );
                    continue; // skip sisa processing
                }
            }

            // ─── Handle Image Message ────────────────────────────────
            const isImage = !!msg.message?.imageMessage;
            let imageCaption = msg.message?.imageMessage?.caption || '';
            let imageUrl: string | null = null;

            if (isImage && enableRealWA) {
                console.log(`🖼️ [IMAGE] Gambar diterima dari ${sender}`);
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', {}) as Buffer;
                    const filename = `product_${Date.now()}.jpg`;
                    imageUrl = await uploadImageToStorage(buffer, filename);
                    if (imageUrl) console.log(`✅ [IMAGE UPLOAD] URL: ${imageUrl}`);
                } catch (err: any) {
                    console.error('[IMAGE ERROR] Gagal download gambar:', err.message);
                }
                // Buat teks dari caption gambar agar diproses AI
                const combinedText = imageCaption
                    ? `[Supplier mengirim foto produk] Keterangan: ${imageCaption}${imageUrl ? ` | URL Foto: ${imageUrl}` : ''}`
                    : `[Supplier mengirim foto produk tanpa keterangan. Tolong tanyakan nama komoditas, berat, dan harga.]`;

                await processIncomingMessage(
                    sender,
                    pushName,
                    combinedText,
                    (jid, content) => sock.sendMessage(jid, content, { quoted: msg })
                );
                continue; // sudah diproses, skip ke pesan berikutnya
            }

            if (!text) {
                console.log(`⏩ [SKIP] Pesan kosong dari ${sender}`);
                continue;
            }

            // Mode Testing: Cek apakah bot boleh membalas pesan riil dari WA
            if (!enableRealWA) {
                console.log(`[TEST MODE] Pesan masuk dari ${sender} tapi bot dilarang membalas oleh .env`);
                continue;
            }

            // Delegasi processing ke layer Handlers
            await processIncomingMessage(
                sender,
                pushName,
                text,
                (jid, content) => sock.sendMessage(jid, content, { quoted: msg })
            );
        }
    });

    return sock;
}


