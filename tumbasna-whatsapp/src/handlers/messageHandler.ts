import { AnyMessageContent } from '@whiskeysockets/baileys';
import { extractMessageData } from '../ai/agent';
import { apiService } from '../services/apiService';

export async function processIncomingMessage(
    sender: string,
    pushName: string,
    text: string,
    sendMessage: (jid: string, content: AnyMessageContent) => Promise<any>
) {
    const rawPhoneNumber = sender.split('@')[0];
    const { getEffectivePhoneNumber, saveMetadata, getLastImageUrl } = await import('../ai/memory');
    const phoneNumber = await getEffectivePhoneNumber(sender);
    console.log(`[ACCESS] Menanggapi pesan dari nomor: ${rawPhoneNumber} (Effective: ${phoneNumber})`);

    const cleanText = text.trim().toLowerCase();

    // 1. Cek status whitelist/registrasi di database terlebih dahulu
    let isRegistered = false;
    let userInfo: any = null;
    console.log(`🔍 [WHITELIST] Mengecek registrasi nomor ${phoneNumber}...`);
    try {
        const whitelistRes = await apiService.checkWhitelist(phoneNumber);
        console.log(`🔍 [WHITELIST RESULT] success=${whitelistRes.success}, isRegistered=${whitelistRes.isRegistered}, name=${whitelistRes.name}`);
        if (whitelistRes.success && whitelistRes.isRegistered) {
            isRegistered = true;
            userInfo = whitelistRes;
        }
    } catch (err: any) {
        console.error(`⚠️ [WHITELIST ERROR] Gagal check whitelist: ${err.message}`);
        // Tetap lanjut — bot harus selalu membalas meskipun dashboard offline
    }
    console.log(`✅ [WHITELIST DONE] isRegistered=${isRegistered}`);

    // 1.5. Cek jika pesan adalah konfirmasi pengiriman barang "KIRIM TRX-xxxxxx"
    // Format didukung:
    //   a) Teks biasa: "KIRIM TRX-987654 JNE1234567890"
    //   b) Foto resi: caption "[RESI FOTO] KIRIM TRX-987654 JNE1234567890 | URL Foto Resi: https://..."
    //   c) Tanpa resi (COD/Kurir Lokal): "KIRIM TRX-987654"
    const isResiFoto = cleanText.startsWith('[resi foto]');
    const rawKirimText = isResiFoto
        ? text.replace(/^\[RESI FOTO\]\s*/i, '').trim()
        : text.trim();
    const kirimMatch = rawKirimText.match(/^kirim\s+(TRX-\S+)(?:\s+(\S+))?/i);

    if (kirimMatch) {
        const trxId = kirimMatch[1].toUpperCase(); // misal: TRX-987654
        const parsedResi = kirimMatch[2] || null;   // misal: JNE1234567890 atau null

        // Ekstrak URL foto resi jika ada (dari caption foto)
        let waybillImageUrl: string | null = null;
        const imgMatch = text.match(/URL Foto Resi:\s*(https?:\/\/\S+)/i);
        if (imgMatch) waybillImageUrl = imgMatch[1];

        try {
            // Ambil detail order untuk cek metode pengiriman
            const orderRes = await apiService.getOrderById(trxId);
            const orderData = orderRes?.data;

            const isEkspedisi = orderData?.courier &&
                !orderData.courier.toLowerCase().includes('cod') &&
                !orderData.courier.toLowerCase().includes('kurir lokal');

            // Jika ekspedisi tapi tidak ada nomor resi → minta resi dulu
            if (isEkspedisi && !parsedResi) {
                const kurirName = orderData.courier || 'Ekspedisi';
                await sendMessage(sender, {
                    text: `📦 *KONFIRMASI PENGIRIMAN — NOMOR RESI DIPERLUKAN*\n\n` +
                          `Pesanan *${trxId}* menggunakan *${kurirName}*.\n\n` +
                          `Untuk melanjutkan, Juragan perlu menyertakan *nomor resi* dari ekspedisi tersebut.\n\n` +
                          `*Cara 1 — Ketik pesan teks:*\n` +
                          `_KIRIM ${trxId} [NOMOR_RESI]_\n` +
                          `Contoh: \`KIRIM ${trxId} JNE1234567890\`\n\n` +
                          `*Cara 2 — Foto resi:*\n` +
                          `Kirimkan foto kertas resi, dengan *keterangan/caption* foto:\n` +
                          `\`KIRIM ${trxId} [NOMOR_RESI]\`\n\n` +
                          `Foto tersebut akan tersimpan sebagai bukti pengiriman resmi. 🧾`
                });
                return;
            }

            // Proses update status ke DIKIRIM
            const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const updatedTimeline = [
                { status: 'Dibuat', time: '08:12', description: 'Pesanan berhasil dibuat oleh pembeli.', done: true },
                { status: 'Dibayar', time: '08:15', description: 'Pembayaran QRIS sukses diverifikasi oleh sistem escrow.', done: true },
                { status: 'Dikirim', time: currentTime, description: parsedResi
                    ? `Barang dikirim melalui ${orderData?.courier || 'ekspedisi'}. Nomor resi: ${parsedResi}.`
                    : 'Barang telah dikirim oleh supplier/kurir lokal.', done: true },
                { status: 'Selesai', time: 'Estimasi', description: 'Menunggu konfirmasi barang sampai dari pembeli.', done: false }
            ];

            const waybillInfo = parsedResi ? {
                waybillNumber: parsedResi,
                waybillCourier: orderData?.courier?.toLowerCase().split(' ')[0]?.replace(/[^a-z]/g, '') || 'jne',
                ...(waybillImageUrl && { waybillImageUrl })
            } : undefined;

            const res = await apiService.updateOrderStatus(trxId, 'DIKIRIM', updatedTimeline, waybillInfo);

            if (res.success) {
                let replyText = `✅ *KONFIRMASI PENGIRIMAN SUKSES*\n\n` +
                    `Pesanan *${trxId}* telah berhasil dikonfirmasi dikirim!\n\n` +
                    `• Status di aplikasi pembeli telah diperbarui secara real-time.\n`;

                if (parsedResi) {
                    replyText += `• Nomor resi *${parsedResi}* telah tercatat di sistem untuk pelacakan.\n`;
                }
                if (waybillImageUrl) {
                    replyText += `• Foto bukti resi telah tersimpan dan dapat dilihat oleh admin & pembeli.\n`;
                }
                replyText += `• Notifikasi otomatis telah dikirimkan ke pembeli.\n\n` +
                    `Terima kasih atas kerja samanya, Juragan! Semoga lancar sampai tujuan! 🌾`;

                await sendMessage(sender, { text: replyText });
            } else {
                await sendMessage(sender, { text: `⚠️ Gagal mengubah status pesanan *${trxId}*. Pastikan ID Pesanan yang Anda masukkan benar.` });
            }
        } catch (err: any) {
            console.error(`Error update order via bot:`, err.message);
            await sendMessage(sender, { text: `❌ Terjadi kesalahan saat memproses pengiriman pesanan *${trxId}*. Silakan coba lagi.` });
        }
        return;
    }

    // 2. Tampilkan Menu Cepat (Numeric / Keyword Shortcuts)
    const menuKeywords = ['menu', 'help', 'bantuan', 'hallo', 'halo', 'p'];
    const numberKeywords = ['1', '2', '3', '4', '5', '6', '7', 'profil', 'rekening', 'saldo', 'listing', 'produk', 'pesanan', 'order', 'jual', 'tambah', 'cs', 'bantuan', 'edit', 'ubah'];

    if (menuKeywords.includes(cleanText) || numberKeywords.includes(cleanText)) {
        if (isRegistered && userInfo) {
            if (menuKeywords.includes(cleanText)) {
                const menuText = `*MENU UTAMA MITRA TUMBASNA* 🌾\n\n` +
                    `Halo Bpk/Ibu *${userInfo.name || pushName}*, selamat datang di layanan WhatsApp Mitra Tumbasna. Ketik kode angka berikut untuk menu transaksi cepat:\n\n` +
                    `*1* 👤 Lihat Profil & Rekening Bank\n` +
                    `*2* 💰 Lihat Saldo Escrow QRIS\n` +
                    `*3* 📦 Lihat Daftar Listing Produk Aktif\n` +
                    `*4* 🛒 Lihat Pesanan Masuk (Order)\n` +
                    `*5* ✍️ Cara Jual / Daftarkan Komoditas\n` +
                    `*6* 📞 Hubungi Bantuan / CS\n` +
                    `*7* ✏️ Edit Profil / Rekening Bank\n\n` +
                    `💡 _Atau Juragan bisa langsung mengetik pesan teks bebas untuk menawarkan hasil tani Juragan secara otomatis._`;
                await sendMessage(sender, { text: menuText });
                return;
            }

            if (cleanText === '1' || cleanText === 'profil' || cleanText === 'rekening') {
                const bankName = userInfo.bankName || '-';
                const bankAccount = userInfo.bankAccount || '-';
                const address = userInfo.address || '-';
                const businessName = userInfo.businessName || '-';
                const businessType = userInfo.businessType || '-';
                
                const profileText = `*PROFIL JURAGAN* 👤\n\n` +
                    `• Nama Lengkap: *${userInfo.name || '-'}*\n` +
                    `• Nama Usaha: *${businessName}*\n` +
                    `• Jenis Usaha: *${businessType}*\n` +
                    `• No. Telepon: *+${phoneNumber}*\n` +
                    `• Alamat Kebun/Gudang: *${address}*\n\n` +
                    `*INFORMASI REKENING BANK*\n` +
                    `• Nama Bank: *${bankName}*\n` +
                    `• No. Rekening: *${bankAccount}*\n\n` +
                    `💡 _Ketik *7* atau *EDIT* jika ingin memperbarui informasi profil atau rekening bank Juragan._\n\n` +
                    `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                await sendMessage(sender, { text: profileText });
                return;
            }

            if (cleanText === '2' || cleanText === 'saldo') {
                const balance = userInfo.balance || 0;
                const balanceText = `*SALDO JURAGAN* 💰\n\n` +
                    `Nama Mitra: *${userInfo.name}*\n` +
                    `Saldo Aktif: *Rp ${balance.toLocaleString('id-ID')}*\n\n` +
                    `_Catatan: Dana QRIS Escrow penjualan otomatis dicairkan ke Saldo Juragan setelah pembeli menyatakan barang sampai (status selesai)._\n\n` +
                    `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                await sendMessage(sender, { text: balanceText });
                return;
            }

            if (cleanText === '3' || cleanText === 'listing' || cleanText === 'produk') {
                try {
                    const result = await apiService.getUserEntries(phoneNumber);
                    if (result.success && result.data.length > 0) {
                        let listText = `*DAFTAR KOMODITAS JURAGAN* 📦\n\n`;
                        result.data.forEach((entry: any, index: number) => {
                            listText += `${index + 1}. *${entry.commodity.toUpperCase()}* [${entry.status}]\n`;
                            listText += `   - Stok Awal: *${entry.originalQty} kg*\n`;
                            listText += `   - Terjual: *${entry.soldQty} kg*\n`;
                            listText += `   - Sisa Stok: *${entry.remainingQty} kg*\n`;
                            listText += `   - Harga: *Rp ${entry.price.toLocaleString('id-ID')}/kg*\n`;
                            listText += `   - Lokasi: ${entry.location}\n\n`;
                        });
                        listText += `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                        await sendMessage(sender, { text: listText });
                    } else {
                        await sendMessage(sender, { text: "Juragan belum memiliki catatan penawaran komoditas di sistem kami.\n\n💡 Ketik *MENU* untuk kembali ke menu utama." });
                    }
                } catch (error) {
                    console.error(`❌ [ERROR LIST] Gagal mengambil list:`, error);
                    await sendMessage(sender, { text: "Maaf, saya gagal mengambil daftar komoditas Juragan. Silakan coba lagi nanti." });
                }
                return;
            }

            if (cleanText === '4' || cleanText === 'pesanan' || cleanText === 'order') {
                try {
                    const result = await apiService.getSupplierOrders(phoneNumber);
                    if (result.success && result.data.length > 0) {
                        let statusText = `*DAFTAR PESANAN MASUK JURAGAN* 🛒\n\n`;
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
                            if (order.status === 'DIPROSES') {
                                statusText += `   👉 _Ketik *KIRIM ${order.id}* jika pesanan ini sudah Anda kirim/berangkatkan._\n`;
                            }
                            statusText += `   Escrow: *${escrowStatus}*\n\n`;
                        });
                        statusText += `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                        await sendMessage(sender, { text: statusText });
                    } else {
                        await sendMessage(sender, { text: "Juragan belum memiliki pesanan masuk di sistem kami.\n\n💡 Ketik *MENU* untuk kembali ke menu utama." });
                    }
                } catch (error) {
                    console.error(`❌ [ERROR ORDERS] Gagal mengambil pesanan:`, error);
                    await sendMessage(sender, { text: "Maaf, saya gagal mengambil daftar pesanan Juragan. Silakan coba lagi nanti." });
                }
                return;
            }

            if (cleanText === '5' || cleanText === 'jual' || cleanText === 'tambah') {
                const sellText = `*DAFTARKAN / JUAL KOMODITAS* ✍️\n\n` +
                    `Silakan kirim detail komoditas yang ingin Juragan tawarkan dalam bentuk pesan teks biasa ke saya.\n\n` +
                    `*Contoh pesan yang bisa Juragan ketik:*\n` +
                    `_"Saya mau jual cabai merah 100 kg harga 30000 per kg dari Banyumas"_\n\n` +
                    `Asisten AI kami akan membaca detail pesan Juragan secara otomatis. Setelah itu, silakan sertakan foto produk agar pembeli lebih berminat. 📸\n\n` +
                    `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                await sendMessage(sender, { text: sellText });
                return;
            }

            if (cleanText === '6' || cleanText === 'bantuan' || cleanText === 'cs') {
                const helpText = `*BANTUAN & LAYANAN PELANGGAN* 📞\n\n` +
                    `Ada kendala transaksi, pencairan dana, atau penggunaan aplikasi? Hubungi Tim Customer Service Tumbasna:\n\n` +
                    `• WhatsApp CS: *wa.me/6281234567890*\n` +
                    `• Email: *support@tumbasna.id*\n` +
                    `• Operasional: *Senin - Minggu (08:00 - 17:00 WIB)*\n\n` +
                    `Kami siap membantu memajukan usaha tani Juragan! 🌾\n\n` +
                    `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                await sendMessage(sender, { text: helpText });
                return;
            }

            if (cleanText === '7' || cleanText === 'edit' || cleanText === 'ubah') {
                const editText = `*MENU EDIT DATA JURAGAN* ✏️\n\n` +
                    `Juragan dapat mengubah data profil atau rekening bank kapan saja dengan mudah:\n\n` +
                    `*1. Ubah Rekening Bank:*\n` +
                    `   Ketik: _"Ubah rekening saya ke BCA 1234567890"_\n` +
                    `   atau _"Ganti bank ke BRI 9876543210"_\n\n` +
                    `*2. Ubah Nama / Nama Usaha:*\n` +
                    `   Ketik: _"Ubah nama usaha saya jadi Kelompok Tani Subur"_\n\n` +
                    `*3. Ubah Lokasi Kebun/Gudang:*\n` +
                    `   Kirimkan *Share Location* terbaru dari WhatsApp (tombol 📎 -> Lokasi).\n\n` +
                    `💡 _Asisten AI kami akan membaca dan memperbarui data Juragan secara otomatis tanpa repot!_\n\n` +
                    `Ketik *MENU* untuk kembali ke menu utama.`;
                await sendMessage(sender, { text: editText });
                return;
            }
        } else {
            // Jika user BELUM terdaftar di database
            if (menuKeywords.includes(cleanText)) {
                const registerMenuText = `*SELAMAT DATANG DI MITRA TUMBASNA* 🌾\n\n` +
                    `Layanan WhatsApp ini digunakan oleh *Mitra Petani/Supplier* untuk memasarkan komoditas pertanian langsung ke pedagang pasar.\n\n` +
                    `Nomor Anda (*+${phoneNumber}*) belum terdaftar di database kami.\n\n` +
                    `*Cara Mendaftar (Sangat Mudah):*\n` +
                    `Ketik pesan teks biasa yang menyebutkan nama Anda dan lokasi gudang/kebun Anda.\n\n` +
                    `*Contoh pesan pendaftaran:*\n` +
                    `_"Halo, saya Pak Sugeng dari Wonosobo mau daftar jadi supplier Tumbasna"_\n\n` +
                    `Asisten AI kami akan langsung mencatat dan mendaftarkan akun Anda secara otomatis! 🤝`;
                await sendMessage(sender, { text: registerMenuText });
            } else {
                const registerHintText = `⚠️ *Nomor Belum Terdaftar*\n\n` +
                    `Maaf Juragan, Anda belum bisa menggunakan menu transaksi cepat ini karena nomor Anda belum terdaftar di sistem Tumbasna.\n\n` +
                    `Silakan lakukan pendaftaran terlebih dahulu dengan mengetik pesan biasa menyebutkan nama dan lokasi Anda.\n` +
                    `*Contoh:* _"Saya Pak Slamet dari Temanggung ingin mendaftar"_`;
                await sendMessage(sender, { text: registerHintText });
            }
            return;
        }
    }

    // 3. Jika input bukan menu cepat, kirim ke AI Agent untuk diproses
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

        // ─── REGISTER: Supplier Baru ───
        if (parsedData.intent === 'REGISTER' && parsedData.status === 'COMPLETE') {
            const phone = parsedData.contact_phone
                ? parsedData.contact_phone.replace(/\D/g, '').replace(/^0/, '62')
                : phoneNumber;
            const name = parsedData.supplier_name || pushName;
            const location = parsedData.supplier_location || '';
            const bankName = parsedData.bank_name || '';
            const bankAccount = parsedData.bank_account || '';

            console.log(`📋 [REGISTER DEBUG] Attempting registration:`, {
                phone, name, location, bankName, bankAccount,
                hasName: !!name, hasLocation: !!location, hasPhone: !!phone
            });
            if (name && location && phone) {
                try {
                    console.log(`🚀 [REGISTER] Calling apiService.registerSupplier...`);
                    const result = await apiService.registerSupplier({ 
                        phone, 
                        name, 
                        location, 
                        bankName, 
                        bankAccount,
                        lat: embeddedLat,
                        lng: embeddedLng
                    });
                    console.log(`✅ [REGISTER] Supplier ${name} berhasil didaftarkan:`, result);
                    if (result.success !== false) {
                        parsedData.reply_message = `🎉 *REGISTRASI BERHASIL!*\n\n` +
                            `Selamat datang di Tumbasna, *${name}*!\n\n` +
                            `Data Anda telah tersimpan:\n` +
                            `📍 Lokasi: ${location}\n` +
                            `📞 Telepon: ${phone}\n` +
                            (bankName ? `🏦 Bank: ${bankName}\n` : '') +
                            (bankAccount ? `💳 No. Rek: ${bankAccount}\n` : '') +
                            `\n✅ Anda sekarang dapat mulai menjual komoditas pertanian Anda!\n\n` +
                            `Ketik *MENU* untuk melihat panduan atau langsung kirim penawaran produk Anda.`;
                    }
                    if (phone !== rawPhoneNumber) {
                        await saveMetadata(sender, { mappedPhone: phone });
                    }
                    const { saveSessionHistory } = await import('../ai/memory');
                    await saveSessionHistory(sender, [], true); // true = delete session
                } catch (err: any) {
                    console.error(`❌ [REGISTER ERROR] Full error:`, err);
                    const { saveSessionHistory } = await import('../ai/memory');
                    if (err?.response?.status !== 409) {
                        console.error(`❌ [REGISTER ERROR] Gagal daftarkan ${name}:`, err.message, err.response?.data);
                        parsedData.reply_message = `Maaf, terjadi kesalahan saat mendaftarkan data Anda. Silakan coba lagi atau hubungi admin.\n\nError: ${err.message}`;
                        await saveSessionHistory(sender, [], true);
                    } else {
                        console.log(`⚠️ [REGISTER] User sudah terdaftar (409), clearing session...`);
                        parsedData.reply_message = `Nomor Anda sudah terdaftar sebelumnya. Anda dapat langsung mengirim penawaran produk!`;
                        await saveSessionHistory(sender, [], true);
                    }
                }
            } else {
                console.warn(`⚠️ [REGISTER] Data tidak lengkap:`, { name, location, phone });
                parsedData.reply_message = `Data pendaftaran belum lengkap. Mohon lengkapi:\n` +
                    (!name ? '- Nama\n' : '') +
                    (!location ? '- Lokasi\n' : '') +
                    (!phone ? '- Nomor telepon\n' : '');
            }
        }

        // ─── SUPPLY / DEMAND: Tambah Komoditas ───
        if (
            (parsedData.intent === 'SUPPLY' || parsedData.intent === 'DEMAND') &&
            (parsedData.status === 'COMPLETE' || parsedData.status === 'WARNING') &&
            parsedData.items.length > 0
        ) {
            const lastImageUrl = await getLastImageUrl(sender);
            for (const item of parsedData.items) {
                console.log(`[ITEM] ${item.commodity} | ${item.weight_kg}kg | Rp${item.price} | ${item.location}`);

                let cleanContactPhone = parsedData.contact_phone
                    ? parsedData.contact_phone.replace(/\D/g, '')
                    : '';
                if (cleanContactPhone.startsWith('0')) {
                    cleanContactPhone = '62' + cleanContactPhone.substring(1);
                }

                let rawImgUrl = (item as any).image_url || lastImageUrl || null;
                if (typeof rawImgUrl === 'string') {
                    rawImgUrl = rawImgUrl.replace(/^(URL Foto:\s*|url foto:\s*)/i, '').trim();
                }

                const payload = {
                    phone: cleanContactPhone || phoneNumber,
                    commodity: item.commodity,
                    volume: item.weight_kg,
                    price: item.price,
                    location: item.location,
                    image: rawImgUrl,
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

                    // Clear last image URL if successfully uploaded
                    if (lastImageUrl) {
                        await saveMetadata(sender, { lastImageUrl: null });
                    }
                } catch (error: any) {
                    console.error(`❌ [ERROR API] Gagal mengirim item ${item.commodity}:`, error.message);
                }
            }
        }

        // ─── EDIT: Update Profil / Rekening / Lokasi ───
        if (parsedData.intent === 'EDIT') {
            try {
                const updatePayload: any = { phone: phoneNumber };
                if (parsedData.supplier_name) updatePayload.name = parsedData.supplier_name;
                if (parsedData.supplier_location) updatePayload.location = parsedData.supplier_location;
                if (parsedData.bank_name) updatePayload.bankName = parsedData.bank_name;
                if (parsedData.bank_account) updatePayload.bankAccount = parsedData.bank_account;

                const res = await apiService.updateUserProfile(updatePayload);
                console.log(`✅ [EDIT] Profile updated for ${phoneNumber}:`, res);

                parsedData.reply_message = `✅ *DATA BERHASIL DIPERBARUI!*\n\n` +
                    `Data profil Juragan telah diperbarui di sistem Tumbasna:\n` +
                    (parsedData.supplier_name ? `• Nama: *${parsedData.supplier_name}*\n` : '') +
                    (parsedData.supplier_location ? `• Lokasi: *${parsedData.supplier_location}*\n` : '') +
                    (parsedData.bank_name ? `• Bank: *${parsedData.bank_name}*\n` : '') +
                    (parsedData.bank_account ? `• Rekening: *${parsedData.bank_account}*\n` : '') +
                    `\n💡 Ketik *1* untuk melihat profil lengkap atau *MENU* untuk kembali.`;

                const { saveSessionHistory } = await import('../ai/memory');
                await saveSessionHistory(sender, [], true);
            } catch (err: any) {
                console.error(`❌ [EDIT ERROR] Gagal update profil:`, err.message);
                parsedData.reply_message = `Maaf, terjadi kesalahan saat memperbarui data Juragan. Silakan coba beberapa saat lagi.`;
            }
        }

        // ─── LIST: Tampilkan Daftar Transaksi ───
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

        // ─── STATUS: Cek Saldo, Status Pesanan, Lacak, Detail ───
        if (parsedData.intent === 'STATUS') {
            const lowerText = text.toLowerCase();
            if (lowerText.includes('saldo') || lowerText.includes('uang') || lowerText.includes('duit')) {
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
                            if (order.status === 'DIPROSES') {
                                statusText += `   👉 _Ketik *KIRIM ${order.id}* jika pesanan ini sudah Anda kirim/berangkatkan._\n`;
                            }
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

        // ─── Build final reply ───
        let finalReply = parsedData.reply_message;

        if (!finalReply || !finalReply.trim()) {
            finalReply = "Halo Juragan! Ada yang bisa saya bantu terkait penawaran hasil tani atau pesanan komoditas Anda? 🌾";
        }

        if (anyMatched) {
            finalReply += '\n\n*KABAR BAIK!* Kami langsung menemukan kecocokan yang pas untuk Anda di sistem!';
            if (matchedPhoneDetails) {
                finalReply += `\nSilakan klik nomor kontak partner Anda di bawah ini untuk berkoordinasi:${matchedPhoneDetails}`;
            }
        }

        // Tambahkan petunjuk menu cepat jika user terdaftar agar AI tidak mengulang
        if (isRegistered) {
            finalReply += '\n\n💡 _Ketik *MENU* untuk melihat menu cepat atau bantuan._';
        }

        await sendMessage(sender, { text: finalReply });
        console.log(`💬 Balasan dikirim ke ${sender} (Intent: ${parsedData.intent}, Status: ${parsedData.status})`);

    } catch (parseError: any) {
        console.error(`❌ [ERROR] Processing gagal:`, parseError.message);
        await sendMessage(sender, { text: 'Maaf, terjadi kesalahan teknis. Mohon coba lagi nanti.' });
    }
}
