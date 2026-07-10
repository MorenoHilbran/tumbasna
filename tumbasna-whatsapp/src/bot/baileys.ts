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
        const FormData = (await import('form-data')).default || await import('form-data');
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
            const sender = msg.key.remoteJid;
            if (!sender) continue;

            const text = extractText(msg.message) || '';
            const isFromMe = msg.key.fromMe || false;

            // Ekstrak nomor telepon asli HANYA untuk database lookup, jangan ubah routing JID Baileys!
            let dbPhoneNumber = sender.split('@')[0]; 
            const anyKey = msg.key as any;
            if (sender.endsWith('@lid') && anyKey.senderPn) {
                dbPhoneNumber = anyKey.senderPn.split('@')[0];
                console.log(`🔄 [LID] Routing ke ${sender}, DB Lookup Phone: ${dbPhoneNumber}`);
            }

            console.log(`📩 [MESSAGE RECEIVED] Dari: ${sender}, Teks: "${text}", fromMe: ${isFromMe}`);

            if (isFromMe) continue; // ignore own messages

            // Abaikan grup/broadcast
            if (sender.endsWith('@g.us') || sender.endsWith('@broadcast')) {
                console.log(`⏩ [SKIP] Mengabaikan pesan grup/status dari: ${sender}`);
                continue;
            }
            
            const pushName = msg.pushName || 'Unknown';
            const enableRealWA = process.env.ENABLE_REAL_WA === 'true';

            // Kirim balasan SECARA STANDAR MENGGUNAKAN JID BAWAAN BAILEYS (LID)
            const sendFn = async (jid: string, content: any) => {
                // jid yang dilempar dari messageHandler adalah dbPhoneNumber@s.whatsapp.net
                // TETAPI kita abaikan dan paksa kirim ke 'sender' (LID) asli berdasarkan penemuan diagnostik
                console.log(`🚀 [DEBUG SEND] Membalas ke: ${sender} ...`);
                try {
                    const result = await sock.sendMessage(sender, content, { quoted: msg });
                    console.log(`✅ [DEBUG SEND SUCCESS] Result key: ${result?.key?.id}`);
                    return result;
                } catch (e: any) {
                    console.error(`❌ [DEBUG SEND ERROR]:`, e.message);
                    throw e;
                }
            };
            
            // ─── Handle Location Message ─────────────────────────────
            const isLocation = !!msg.message?.locationMessage;
            if (isLocation && enableRealWA && msg.message?.locationMessage) {
                const locMsg = msg.message!.locationMessage!;
                const lat = locMsg.degreesLatitude || 0;
                const lng = locMsg.degreesLongitude || 0;
                if (lat && lng) {
                    const addressName = await reverseGeocode(lat, lng);
                    console.log(`📍 [LOCATION] Alamat terdeteksi: ${addressName}`);

                    const combinedText = `[Supplier mengirim share location] Nama Lokasi: ${addressName} | Lat: ${lat} | Lng: ${lng}`;
                    
                    await processIncomingMessage(sender, pushName, combinedText, sendFn);
                    continue;
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

                    // Deteksi apakah ini foto RESI (caption mengandung pola KIRIM TRX-...)
                    const isWaybillPhoto = /^kirim\s+TRX-/i.test(imageCaption.trim());

                    if (isWaybillPhoto) {
                        // Upload sebagai foto bukti resi pengiriman
                        const filename = `resi_${Date.now()}.jpg`;
                        imageUrl = await uploadImageToStorage(buffer, filename);
                        console.log(`📦 [RESI FOTO] Foto resi dari ${sender}, URL: ${imageUrl}`);
                        // Gabungkan perintah KIRIM + URL foto resi dalam satu teks khusus
                        const resiText = `[RESI FOTO] ${imageCaption.trim()}${imageUrl ? ` | URL Foto Resi: ${imageUrl}` : ''}`;
                        await processIncomingMessage(sender, pushName, resiText, sendFn);
                    } else {
                        // Foto produk biasa
                        const filename = `product_${Date.now()}.jpg`;
                        imageUrl = await uploadImageToStorage(buffer, filename);
                        if (imageUrl) {
                            const { saveMetadata } = await import('../ai/memory');
                            await saveMetadata(sender, { lastImageUrl: imageUrl });
                        }
                        const combinedText = imageCaption
                            ? `[Supplier mengirim foto produk] Keterangan: ${imageCaption}${imageUrl ? ` | URL Foto: ${imageUrl}` : ''}`
                            : `[Supplier mengirim foto produk tanpa keterangan. Tolong tanyakan nama komoditas, berat, dan harga.]`;
                        await processIncomingMessage(sender, pushName, combinedText, sendFn);
                    }
                } catch (err: any) {
                    console.error('[IMAGE ERROR] Gagal download gambar:', err.message);
                    const combinedText = imageCaption
                        ? `[Supplier mengirim foto] Keterangan: ${imageCaption}`
                        : `[Supplier mengirim foto tanpa keterangan.]`;
                    await processIncomingMessage(sender, pushName, combinedText, sendFn);
                }
                continue;
            }

            if (!text) {
                console.log(`⏩ [SKIP] Pesan kosong`);
                continue;
            }

            // Mode Testing: Cek apakah bot boleh membalas pesan riil dari WA
            if (!enableRealWA) {
                console.log(`[TEST MODE] Pesan masuk dari ${sender} tapi bot dilarang membalas oleh .env`);
                continue;
            }

            // Delegasi processing ke layer Handlers
            await processIncomingMessage(sender, pushName, text, sendFn);
        }
    });

    return sock;
}
