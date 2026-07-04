import { AnyMessageContent } from '@whiskeysockets/baileys';
import { extractMessageData } from '../ai/agent';
import { apiService } from '../services/apiService';

export async function processIncomingMessage(
    sender: string,
    pushName: string,
    text: string,
    sendMessage: (jid: string, content: AnyMessageContent) => Promise<any>
) {
    const phoneNumber = sender.split('@')[0];
    console.log(`[ACCESS] Menanggapi pesan dari nomor: ${phoneNumber}`);

    // Cek apakah ada koordinat GPS tersemat dalam pesan input
    const latMatch = text.match(/Lat:\s*([\d.-]+)/);
    const lngMatch = text.match(/Lng:\s*([\d.-]+)/);
    const embeddedLat = latMatch ? parseFloat(latMatch[1]) : null;
    const embeddedLng = lngMatch ? parseFloat(lngMatch[1]) : null;

    console.log(`[AI PROCESSING] Menganalisis pesan dari ${pushName}: "${text}"`);
    
    try {
        const parsedData = await extractMessageData(sender, text);
        let anyMatched = false;
        let matchedPhoneDetails = '';

        // ─── 1. REGISTER: Supplier Baru ──────────────────────────────────────
        if (parsedData.intent === 'REGISTER' && parsedData.status === 'COMPLETE') {
            const phone = parsedData.contact_phone
                ? parsedData.contact_phone.replace(/\D/g, '').replace(/^0/, '62')
                : phoneNumber;
            const name = parsedData.supplier_name || pushName;
            const location = parsedData.supplier_location || '';

            if (name && location && phone) {
                try {
                    const result = await apiService.registerSupplier({ phone, name, location });
                    console.log(`✅ [REGISTER] Supplier ${name} berhasil didaftarkan:`, result);
                    // Reset session memory setelah berhasil registrasi
                    // sehingga AI tidak mengulangi proses REGISTER di percakapan berikutnya
                    const { saveSessionHistory } = require('../ai/memory');
                    await saveSessionHistory(sender, [], true); // true = delete session
                } catch (err: any) {
                    // 409 = nomor sudah terdaftar, bukan error fatal
                    if (err?.response?.status !== 409) {
                        console.error(`❌ [REGISTER ERROR] Gagal daftarkan ${name}:`, err.message);
                    } else {
                        console.log(`ℹ️ [REGISTER] Nomor ${phone} sudah terdaftar sebelumnya.`);
                    }
                }
            }
        }

        // ─── 2. SUPPLY / DEMAND: Tambah Komoditas ────────────────────────────
        if (
            (parsedData.intent === 'SUPPLY' || parsedData.intent === 'DEMAND') &&
            (parsedData.status === 'COMPLETE' || parsedData.status === 'WARNING') &&
            parsedData.items.length > 0
        ) {
            for (const item of parsedData.items) {
                console.log(`[ITEM] ${item.commodity} | ${item.weight_kg}kg | Rp${item.price} | ${item.location}`);

                let cleanContactPhone = parsedData.contact_phone
                    ? parsedData.contact_phone.replace(/\D/g, '')
                    : '';
                if (cleanContactPhone.startsWith('0')) {
                    cleanContactPhone = '62' + cleanContactPhone.substring(1);
                }

                const payload = {
                    phone: cleanContactPhone || phoneNumber,
                    commodity: item.commodity,
                    volume: item.weight_kg,
                    price: item.price,
                    location: item.location,
                    image: (item as any).image_url || null,
                    lat: embeddedLat,
                    lng: embeddedLng,
                };

                try {
                    let apiResult;
                    if (parsedData.intent === 'SUPPLY') {
                        apiResult = await apiService.sendSupply(payload);
                    } else {
                        apiResult = await apiService.sendDemand(payload);
                    }

                    if (apiResult?.matched) {
                        anyMatched = true;
                        if (apiResult.matched.user?.phoneNumber) {
                            matchedPhoneDetails += `\n- ${item.commodity}: wa.me/${apiResult.matched.user.phoneNumber}`;
                        }
                    }
                } catch (error: any) {
                    console.error(`❌ [ERROR API] Gagal mengirim item ${item.commodity}:`, error.message);
                }
            }
        }

        // ─── 3. LIST: Tampilkan Daftar Transaksi ─────────────────────────────
        if (parsedData.intent === 'LIST') {
            try {
                const result = await apiService.getUserEntries(phoneNumber);
                if (result.success && result.data.length > 0) {
                    let listText = `📋 *DAFTAR CATATAN ANDA*\n\n`;
                    result.data.forEach((entry: any, index: number) => {
                        const statusEmoji = entry.status === 'MATCHED' ? '✅' : entry.status === 'ACTIVE' ? '⏳' : '🏁';
                        const typeLabel = entry.type === 'SUPPLY' ? 'Penawaran' : 'Permintaan';
                        listText += `${index + 1}. [${statusEmoji} ${entry.status}] *${typeLabel}*\n   📦 ${entry.commodity}\n   ⚖️ ${entry.qty}kg\n   💰 Rp${entry.price.toLocaleString('id-ID')}\n   📍 ${entry.location}\n\n`;
                    });
                    listText += `_Status: ⏳ Aktif | ✅ Match | 🏁 Selesai_`;
                    parsedData.reply_message = listText;
                } else {
                    parsedData.reply_message = "Anda belum memiliki catatan transaksi di sistem kami.";
                }
            } catch (error) {
                console.error(`❌ [ERROR LIST] Gagal mengambil list:`, error);
                parsedData.reply_message = "Maaf, saya gagal mengambil daftar catatan Anda. Silakan coba lagi nanti.";
            }
        }

        // ─── 4. Build final reply ─────────────────────────────────────────────
        let finalReply = parsedData.reply_message;

        if (anyMatched) {
            finalReply += '\n\n🎉 *KABAR BAIK!* Kami langsung menemukan kecocokan yang pas untuk Anda di sistem!';
            if (matchedPhoneDetails) {
                finalReply += `\nSilakan klik nomor kontak partner Anda di bawah ini untuk berkoordinasi:${matchedPhoneDetails}`;
            }
        }

        await sendMessage(sender, { text: finalReply });
        console.log(`💬 Balasan dikirim ke ${sender} (Intent: ${parsedData.intent}, Status: ${parsedData.status})`);

    } catch (parseError: any) {
        console.error(`❌ [ERROR] Processing gagal:`, parseError.message);
        await sendMessage(sender, { text: 'Maaf, terjadi kesalahan teknis. Mohon coba lagi nanti.' });
    }
}
