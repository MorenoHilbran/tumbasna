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
                    const { saveSessionHistory } = require('../ai/memory');
                    // 409 = nomor sudah terdaftar, bukan error fatal
                    if (err?.response?.status !== 409) {
                        console.error(`❌ [REGISTER ERROR] Gagal daftarkan ${name}:`, err.message);
                    } else {
                        console.log(`ℹ️ [REGISTER] Nomor ${phone} sudah terdaftar sebelumnya. Resetting session history.`);
                        await saveSessionHistory(sender, [], true); // true = delete session
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
                    let listText = `*DAFTAR KOMODITAS JURAGAN*\n\n`;
                    result.data.forEach((entry: any, index: number) => {
                        listText += `${index + 1}. *${entry.commodity.toUpperCase()}* [${entry.status}]\n`;
                        listText += `   - Stok Awal: *${entry.originalQty} kg*\n`;
                        listText += `   - Terjual: *${entry.soldQty} kg*\n`;
                        listText += `   - Sisa Stok: *${entry.remainingQty} kg*\n`;
                        listText += `   - Harga: *Rp ${entry.price.toLocaleString('id-ID')}/kg*\n`;
                        listText += `   - Lokasi: ${entry.location}\n\n`;
                    });
                    parsedData.reply_message = listText;
                } else {
                    parsedData.reply_message = "Juragan belum memiliki catatan penawaran komoditas di sistem kami.";
                }
            } catch (error) {
                console.error(`❌ [ERROR LIST] Gagal mengambil list:`, error);
                parsedData.reply_message = "Maaf, saya gagal mengambil daftar komoditas Juragan. Silakan coba lagi nanti.";
            }
        }

        // ─── 4. STATUS: Cek Saldo, Status Pesanan, Lacak, Detail ──────────────
        if (parsedData.intent === 'STATUS') {
            const lowerText = text.toLowerCase();
            if (lowerText.includes('saldo') || lowerText.includes('uang') || lowerText.includes('duit')) {
                // Flow cek saldo
                try {
                    const whitelistRes = await apiService.checkWhitelist(phoneNumber);
                    if (whitelistRes.success && whitelistRes.isRegistered) {
                        const balance = whitelistRes.balance || 0;
                        parsedData.reply_message = `*SALDO JURAGAN*\n\n` +
                            `Nama: *${whitelistRes.name}*\n` +
                            `Saldo Aktif: *Rp ${balance.toLocaleString('id-ID')}*\n\n` +
                            `_Catatan: Dana QRIS Escrow penjualan otomatis dicairkan ke Saldo Juragan setelah pembeli menyatakan barang sampai (status selesai)._`;
                    } else {
                        parsedData.reply_message = "Nomor Anda belum terdaftar di sistem kami.";
                    }
                } catch (error) {
                    console.error(`❌ [ERROR BALANCE] Gagal mengambil saldo:`, error);
                    parsedData.reply_message = "Maaf, saya gagal mengambil informasi saldo Anda. Silakan coba lagi nanti.";
                }
            } else {
                // Flow cek pesanan / lacak / detail
                try {
                    const result = await apiService.getSupplierOrders(phoneNumber);
                    if (result.success && result.data.length > 0) {
                        let statusText = `*DAFTAR PESANAN MASUK JURAGAN*\n\n`;
                        result.data.forEach((order: any, index: number) => {
                            const itemsText = order.items.map((it: any) => `  - ${it.product.name} (x${it.quantity})`).join('\n');
                            
                            const escrowStatus = order.status === 'SELESAI' 
                                ? 'Escrow Cair (Masuk Saldo)' 
                                : 'Escrow Ditahan (Dana aman di QRIS Escrow, menunggu barang diterima pembeli)';

                            let trackingInfo = `Kurir: *${order.courier}*`;
                            if (order.trackingTimeline && Array.isArray(order.trackingTimeline) && order.trackingTimeline.length > 0) {
                                const latestTimeline = order.trackingTimeline[order.trackingTimeline.length - 1];
                                const timelineStr = typeof latestTimeline === 'object' ? (latestTimeline.status || latestTimeline.description || JSON.stringify(latestTimeline)) : latestTimeline;
                                trackingInfo += `\n   Lacak Terakhir: _${timelineStr}_`;
                            } else {
                                trackingInfo += `\n   Lacak Terakhir: _Belum ada pergerakan_`;
                            }

                            statusText += `${index + 1}. *ID Pesanan: ${order.id}*\n`;
                            statusText += `   Komoditas:\n${itemsText}\n`;
                            statusText += `   Pengiriman: ${trackingInfo}\n`;
                            statusText += `   Total Pembayaran: *Rp ${order.totalAmount.toLocaleString('id-ID')}*\n`;
                            statusText += `   Status: *${order.status}*\n`;
                            statusText += `   Escrow: *${escrowStatus}*\n\n`;
                        });
                        parsedData.reply_message = statusText;
                    } else {
                        parsedData.reply_message = "Juragan belum memiliki pesanan masuk di sistem kami.";
                    }
                } catch (error) {
                    console.error(`❌ [ERROR ORDERS] Gagal mengambil pesanan:`, error);
                    parsedData.reply_message = "Maaf, saya gagal mengambil daftar pesanan Juragan. Silakan coba lagi nanti.";
                }
            }
        }

        // ─── 5. Build final reply ─────────────────────────────────────────────
        let finalReply = parsedData.reply_message;

        if (anyMatched) {
            finalReply += '\n\n*KABAR BAIK!* Kami langsung menemukan kecocokan yang pas untuk Anda di sistem!';
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
