import { AnyMessageContent } from '@whiskeysockets/baileys';
import { extractMessageData } from '../ai/agent';
import { apiService } from '../services/apiService';

interface DeleteAccountState {
    step: 1 | 2;
    code?: string;
    expiresAt: number;
}

interface DeleteProductState {
    entryId: string;
    commodityName: string;
    qty: number;
    price: number;
    expiresAt: number;
}

interface ChatViewState {
    buyers: Array<{ buyerPhone: string; buyerName: string | null; lastMessage: string; lastTime: string }>;
    expiresAt: number;
}

// State pendaftaran hardcoded (tidak bergantung AI) agar contoh jawaban selalu konsisten
interface RegisterState {
    step: 1 | 2 | 3 | 4; // 1=nama, 2=lokasi, 3=rekening, 4=nomor HP
    name?: string;
    businessName?: string;
    location?: string;
    lat?: number;
    lng?: number;
    bankName?: string;
    bankAccount?: string;
    expiresAt: number;
}

const deleteAccountStateMap = new Map<string, DeleteAccountState>();
const deleteProductStateMap = new Map<string, DeleteProductState>();
const chatViewStateMap = new Map<string, ChatViewState>();
const registerStateMap = new Map<string, RegisterState>();

// Pesan hardcoded untuk tiap langkah pendaftaran
const REGISTER_STEP_1 = 
    `*Langkah 1 dari 4 — Nama*\n\n` +
    `Siapa nama lengkap Anda dan nama usaha/kebun Anda?\n\n` +
    `📝 Contoh jawaban:\n` +
    `_Pak Sugeng — Kebun Makmur Wonosobo_\n` +
    `_Bu Sari — UD Sari Tani Purbalingga_\n` +
    `_Alfaen — Kebun Alfaen Banyumas_`;

const REGISTER_STEP_2 =
    `*Langkah 2 dari 4 — Lokasi Kebun/Gudang*\n\n` +
    `Kirim titik lokasi kebun atau gudang Anda menggunakan fitur *Share Location* WhatsApp:\n\n` +
    `1️⃣ Tekan ikon 📎 *(Lampiran)* di bawah layar\n` +
    `2️⃣ Pilih *Lokasi*\n` +
    `3️⃣ Pilih *Kirim Lokasi Saat Ini*\n\n` +
    `⚠️ *Jangan ketik nama kota saja* — harus menggunakan tombol Share Location agar koordinat GPS Anda tercatat dengan akurat di peta Tumbasna.`;

const REGISTER_STEP_2_RETRY =
    `⚠️ Maaf, saya tidak bisa menerima alamat berupa teks.\n\n` +
    `Mohon kirimkan *titik lokasi GPS* menggunakan fitur Share Location WhatsApp:\n\n` +
    `1️⃣ Tekan ikon 📎 *(Lampiran)* di bawah layar\n` +
    `2️⃣ Pilih *Lokasi*\n` +
    `3️⃣ Pilih *Kirim Lokasi Saat Ini*\n\n` +
    `Koordinat GPS dibutuhkan agar kebun/gudang Anda tampil di peta aplikasi Tumbasna.`;

const REGISTER_STEP_3 =
    `*Langkah 3 dari 4 — Rekening Bank*\n\n` +
    `Untuk pencairan dana hasil penjualan QRIS, kirimkan informasi rekening bank Anda.\n\n` +
    `📝 Format: *[Nama Bank] [Nomor Rekening]*\n\n` +
    `Contoh jawaban:\n` +
    `_BRI 123456789012_\n` +
    `_BCA 8801234567_\n` +
    `_Mandiri 1230004567890_\n` +
    `_BSI 7123456789_`;

const REGISTER_STEP_4 =
    `*Langkah 4 dari 4 — Nomor WhatsApp* (Terakhir!)\n\n` +
    `Ketik nomor WhatsApp aktif Anda untuk dihubungi oleh pembeli dari aplikasi Tumbasna.\n\n` +
    `📝 Format: awali dengan *08* atau *628*\n\n` +
    `Contoh jawaban:\n` +
    `_085869236023_\n` +
    `_6285869236023_\n\n` +
    `_(Nomor ini yang akan tampil ke pembeli di aplikasi Tumbasna)_`;


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

    // 1.2. Cek pembatalan alur penghapusan akun atau produk
    if (cleanText === 'batal') {
        let cancelledAny = false;
        if (deleteAccountStateMap.has(phoneNumber)) {
            deleteAccountStateMap.delete(phoneNumber);
            cancelledAny = true;
        }
        if (deleteProductStateMap.has(phoneNumber)) {
            deleteProductStateMap.delete(phoneNumber);
            cancelledAny = true;
        }
        // Cek juga batalkan alur pendaftaran
        if (registerStateMap.has(phoneNumber)) {
            registerStateMap.delete(phoneNumber);
            cancelledAny = true;
            await sendMessage(sender, {
                text: `❌ *Pendaftaran dibatalkan.*\n\nJika ingin mendaftar lagi, cukup ketik *halo* atau *menu*.`
            });
            return;
        }
        if (cancelledAny) {
            await sendMessage(sender, {
                text: `❌ *PENGHAPUSAN DIBATALKAN*\n\nProses penghapusan telah dibatalkan. Data Juragan tetap aman di Tumbasna. 🌾\n\n💡 Ketik *MENU* untuk kembali ke menu utama.`
            });
            return;
        }
    }

    // 1.2.5. HARDCODED REGISTRATION FLOW (untuk user belum terdaftar)
    // Ini menggantikan AI untuk flow pendaftaran agar pertanyaan selalu konsisten dengan contoh yang jelas
    if (!isRegistered) {
        const regState = registerStateMap.get(phoneNumber);

        // Jika pesan adalah lokasi GPS (dari baileys.ts yang sudah convert jadi teks)
        const isLocationMsg = text.startsWith('[Supplier mengirim share location]');

        // Step 1: User baru belum punya state → mulai flow pendaftaran
        if (!regState && !isLocationMsg) {
            // Jika user kirim menu keyword → tampilkan welcome dan mulai step 1
            const menuTriggers = ['menu', 'halo', 'hallo', 'hai', 'hi', 'help', 'bantuan', 'p', 'daftar', 'register'];
            if (menuTriggers.includes(cleanText) || cleanText.length > 3) {
                // Cek apakah ini percakapan awal atau lanjutan
                // Jika belum punya state, langsung mulai step 1
                registerStateMap.set(phoneNumber, {
                    step: 1,
                    expiresAt: Date.now() + 30 * 60 * 1000 // 30 menit
                });
                const welcomeText =
                    `*SELAMAT DATANG DI MITRA TUMBASNA* 🌾\n\n` +
                    `Platform jual beli komoditas pertanian langsung dari supplier ke pedagang pasar.\n\n` +
                    `Nomor Anda belum terdaftar. Saya akan pandu pendaftaran Anda dalam *4 langkah cepat*.\n\n` +
                    `━━━━━━━━━━━━━━━\n\n` +
                    REGISTER_STEP_1;
                await sendMessage(sender, { text: welcomeText });
                return;
            }
        }

        // Jika user sudah punya state register
        if (regState) {
            // Cek expired (30 menit)
            if (Date.now() > regState.expiresAt) {
                registerStateMap.delete(phoneNumber);
                await sendMessage(sender, {
                    text: `⏱️ Sesi pendaftaran telah kadaluarsa.\n\nKetik *halo* untuk memulai ulang pendaftaran.`
                });
                return;
            }

            // STEP 1: Menerima nama
            if (regState.step === 1) {
                // Skip jika lokasi atau pesan terlalu pendek
                if (isLocationMsg || cleanText.length < 3) {
                    await sendMessage(sender, { text: REGISTER_STEP_1 });
                    return;
                }
                // Parse nama dan nama usaha dari input
                let parsedName = text.trim();
                let parsedBusiness = '';
                const separators = [' — ', ' - ', ' | ', ',', '('];
                for (const sep of separators) {
                    if (text.includes(sep)) {
                        const parts = text.split(sep);
                        parsedName = parts[0].trim();
                        parsedBusiness = parts.slice(1).join(sep).trim().replace(/[()]/g, '').trim();
                        break;
                    }
                }
                registerStateMap.set(phoneNumber, {
                    ...regState,
                    step: 2,
                    name: parsedName,
                    businessName: parsedBusiness || parsedName,
                    expiresAt: Date.now() + 30 * 60 * 1000
                });
                const step2Text =
                    `✅ Nama tercatat: *${parsedName}*${parsedBusiness ? ` (${parsedBusiness})` : ''}\n\n` +
                    `━━━━━━━━━━━━━━━\n\n` +
                    REGISTER_STEP_2;
                await sendMessage(sender, { text: step2Text });
                return;
            }

            // STEP 2: Menerima lokasi
            if (regState.step === 2) {
                if (!isLocationMsg) {
                    // User mengetik teks, bukan share location
                    await sendMessage(sender, { text: REGISTER_STEP_2_RETRY });
                    return;
                }
                // Parse koordinat dari pesan lokasi yang sudah diformat oleh baileys.ts
                const latMatch = text.match(/Lat:\s*([\d.-]+)/);
                const lngMatch = text.match(/Lng:\s*([\d.-]+)/);
                const nameMatch = text.match(/Nama Lokasi:\s*([^|]+)/);
                const lat = latMatch ? parseFloat(latMatch[1]) : undefined;
                const lng = lngMatch ? parseFloat(lngMatch[1]) : undefined;
                const locationName = nameMatch ? nameMatch[1].trim() : 'Lokasi tidak diketahui';

                registerStateMap.set(phoneNumber, {
                    ...regState,
                    step: 3,
                    location: locationName,
                    lat,
                    lng,
                    expiresAt: Date.now() + 30 * 60 * 1000
                });
                const step3Text =
                    `✅ Lokasi tercatat: 📍 *${locationName}*\n\n` +
                    `━━━━━━━━━━━━━━━\n\n` +
                    REGISTER_STEP_3;
                await sendMessage(sender, { text: step3Text });
                return;
            }

            // STEP 3: Menerima rekening bank → simpan ke state, lanjut ke step 4
            if (regState.step === 3) {
                if (isLocationMsg) {
                    await sendMessage(sender, { text: REGISTER_STEP_3 });
                    return;
                }
                // Parse nama bank dan nomor rekening
                const bankKeywords = ['bri', 'bca', 'mandiri', 'bni', 'bsi', 'cimb', 'danamon', 'btn', 'permata', 'ocbc', 'maybank', 'panin'];
                let bankName = '';
                let bankAccount = '';
                const parts = text.trim().split(/\s+/);
                for (const part of parts) {
                    const partLower = part.toLowerCase().replace(/[^a-z]/g, '');
                    if (bankKeywords.some(k => partLower.includes(k)) && !bankName) {
                        bankName = part.toUpperCase();
                    } else if (/^\d{6,}$/.test(part.replace(/[-\s]/g, ''))) {
                        bankAccount = part.replace(/[-\s]/g, '');
                    }
                }
                if (!bankName || !bankAccount) {
                    await sendMessage(sender, {
                        text: `⚠️ Format tidak dikenali.\n\n` + REGISTER_STEP_3
                    });
                    return;
                }
                // Simpan bank info ke state, lanjut step 4
                registerStateMap.set(phoneNumber, {
                    ...regState,
                    step: 4,
                    bankName,
                    bankAccount,
                    expiresAt: Date.now() + 30 * 60 * 1000
                });
                const step4Text =
                    `✅ Rekening tercatat: *${bankName}* ${bankAccount}\n\n` +
                    `━━━━━━━━━━━━━━━\n\n` +
                    REGISTER_STEP_4;
                await sendMessage(sender, { text: step4Text });
                return;
            }

            // STEP 4: Menerima nomor HP → daftarkan ke API
            if (regState.step === 4) {
                if (isLocationMsg) {
                    await sendMessage(sender, { text: REGISTER_STEP_4 });
                    return;
                }
                // Parse nomor HP — normalisasi ke format 628xxx
                const digitsOnly = text.replace(/\D/g, '');
                let finalPhone = digitsOnly;
                if (finalPhone.startsWith('08')) {
                    finalPhone = '62' + finalPhone.slice(1);
                } else if (finalPhone.startsWith('8') && finalPhone.length >= 9) {
                    finalPhone = '62' + finalPhone;
                }
                if (finalPhone.length < 10 || !finalPhone.startsWith('62')) {
                    await sendMessage(sender, {
                        text: `⚠️ Nomor tidak valid. Pastikan format yang benar.\n\n` + REGISTER_STEP_4
                    });
                    return;
                }

                // Semua data lengkap → daftarkan ke API
                registerStateMap.delete(phoneNumber);
                try {
                    await apiService.registerSupplier({
                        phone: finalPhone,
                        name: regState.name || pushName,
                        businessName: regState.businessName || regState.name || pushName,
                        location: regState.location || '',
                        bankName: regState.bankName || '',
                        bankAccount: regState.bankAccount || '',
                        lat: regState.lat ?? null,
                        lng: regState.lng ?? null
                    });

                    // Jika nomor WA (sender) berbeda dengan nomor yang diinput, simpan mapping
                    if (finalPhone !== phoneNumber) {
                        const { saveMetadata } = await import('../ai/memory');
                        await saveMetadata(sender, { mappedPhone: finalPhone });
                    }

                    const displayPhone = '0' + finalPhone.replace(/^62/, '');
                    const menuText =
                        `*MENU UTAMA MITRA TUMBASNA* 🌾\n\n` +
                        `Halo Bpk/Ibu *${regState.name}*, akun Anda sudah aktif! Ketik kode angka berikut:\n\n` +
                        `*1* 👤 Lihat Profil & Rekening Bank\n` +
                        `*2* 💰 Lihat Saldo Escrow QRIS\n` +
                        `*3* 📦 Lihat Daftar Listing Produk Aktif\n` +
                        `*4* 🛒 Lihat Pesanan Masuk (Order)\n` +
                        `*5* ✍️ Cara Jual / Daftarkan Komoditas\n` +
                        `*6* 📞 Hubungi Bantuan / CS\n` +
                        `*7* ✏️ Edit Profil / Rekening Bank\n` +
                        `*8* 🗑️ Hapus Akun & Data Saya\n` +
                        `*9* 💬 Inbox Chat Pembeli\n\n` +
                        `💡 _Atau Juragan bisa langsung mengetik pesan teks bebas untuk menawarkan hasil tani Juragan secara otomatis._`;

                    const successText =
                        `🎉 *PENDAFTARAN BERHASIL!*\n\n` +
                        `Selamat bergabung, *${regState.name}*!\n\n` +
                        `Data tersimpan:\n` +
                        `📞 No. HP: ${displayPhone}\n` +
                        `📍 Lokasi: ${regState.location}\n` +
                        `🏦 Bank: ${regState.bankName}\n` +
                        `💳 No. Rek: ${regState.bankAccount}\n\n` +
                        `✅ Akun Anda sudah aktif!`;

                    await sendMessage(sender, { text: successText });
                    await sendMessage(sender, { text: menuText });
                    console.log(`✅ [REGISTER HARDCODED] ${regState.name} (${finalPhone}) berhasil didaftarkan`);
                } catch (err: any) {
                    if (err?.response?.status === 409) {
                        await sendMessage(sender, {
                            text: `ℹ️ Nomor ${finalPhone} sudah terdaftar sebelumnya.\n\nKetik *MENU* untuk melihat menu utama.`
                        });
                    } else {
                        console.error(`❌ [REGISTER HARDCODED ERROR]`, err.message);
                        await sendMessage(sender, {
                            text: `❌ Maaf, terjadi kesalahan saat mendaftarkan akun Anda.\n\nSilakan coba lagi atau hubungi CS kami.`
                        });
                        registerStateMap.set(phoneNumber, { ...regState, step: 4 });
                    }
                }
                return;
            }
        }
    }

    // 1.3. Cek jika pesan adalah balasan supplier untuk buyer
    // Pattern: Supplier membalas pesan yang mengandung info buyer dari Tumbasna
    // Kita deteksi jika supplier baru saja menerima pesan dari buyer (dalam konteks chat terakhir)
    // Definisikan keyword bot di sini untuk dipakai pada pengecekan awal
    const botMenuKeywords = ['menu', 'help', 'bantuan', 'hallo', 'halo', 'p'];
    const botNumberKeywords = ['1', '2', '3', '4', '5', '6', '7', '8', 'profil', 'rekening', 'saldo', 'listing', 'produk', 'pesanan', 'order', 'jual', 'tambah', 'cs', 'edit', 'ubah', 'hapus akun', 'hapus data'];
    // Pesan sistem relay dari Tumbasna — jangan diproses sebagai supplier reply
    const isTumbasnaSystemMessage = text.includes('Pesan dari Pembeli Tumbasna') || text.includes('tumbasna-rahasia') || text.startsWith('✅ Pesan Anda telah terkirim');

    if (isRegistered && text && !text.startsWith('[') && !text.toLowerCase().startsWith('kirim ') && !isTumbasnaSystemMessage) {
        // Cek apakah supplier ini baru saja menerima pesan dari buyer (cek recent chat history)
        try {
            const recentChats = await apiService.getRecentChatsForSupplier(phoneNumber);
            if (recentChats && recentChats.length > 0) {
                // Ambil buyer phone dari chat terakhir
                const lastChat = recentChats[0];
                const buyerPhone = lastChat.buyerPhone;
                
                // Guard: skip jika buyerPhone sama dengan supplierPhone
                // (kasus testing dengan nomor yang sama — mencegah infinite loop)
                const isSameNumber = buyerPhone && buyerPhone.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '');

                // Jika ada buyer phone yang berbeda dan pesan ini bukan command bot
                if (buyerPhone && !isSameNumber && text.trim().length > 0 && !botMenuKeywords.includes(cleanText) && !botNumberKeywords.includes(cleanText)) {
                    console.log(`💬 [CHAT REPLY] Supplier ${phoneNumber} membalas buyer ${buyerPhone}`);
                    
                    // Save reply supplier ke database
                    await apiService.saveChatMessage({
                        buyerPhone,
                        supplierPhone: phoneNumber,
                        message: text.trim(),
                        sender: 'supplier'
                    });
                    
                    // Kirim konfirmasi ke supplier
                    await sendMessage(sender, { 
                        text: `✅ Pesan Anda telah terkirim ke pembeli dan tersimpan di chat history Tumbasna.\n\n💡 Ketik *MENU* untuk kembali ke menu utama.` 
                    });
                    
                    console.log(`✅ [CHAT REPLY SAVED] Reply dari supplier ${phoneNumber} untuk buyer ${buyerPhone}`);
                    return; // Stop processing, karena ini adalah chat reply
                } else if (isSameNumber) {
                    console.log(`⚠️ [CHAT REPLY SKIP] buyerPhone === supplierPhone (${phoneNumber}), skip untuk hindari loop.`);
                }
            }
        } catch (chatErr: any) {
            console.warn(`⚠️ [CHAT REPLY CHECK] Error checking recent chats: ${chatErr.message}`);
            // Lanjutkan ke flow normal jika error
        }
    }

    // 1.3.5. Cek jika supplier sedang dalam mode Chat View (pilih nomor buyer untuk lihat history)
    if (chatViewStateMap.has(phoneNumber)) {
        const chatState = chatViewStateMap.get(phoneNumber)!;

        // Cek expired (10 menit)
        if (Date.now() > chatState.expiresAt) {
            chatViewStateMap.delete(phoneNumber);
        } else {
            const selectedIndex = parseInt(cleanText, 10) - 1;

            if (cleanText === 'batal' || cleanText === 'menu' || cleanText === 'keluar') {
                chatViewStateMap.delete(phoneNumber);
                await sendMessage(sender, { text: `💡 Ketik *MENU* untuk melihat menu utama.` });
                return;
            }

            if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < chatState.buyers.length) {
                const selectedBuyer = chatState.buyers[selectedIndex];
                chatViewStateMap.delete(phoneNumber);

                // Ambil history chat
                try {
                    const history = await apiService.getChatHistory(selectedBuyer.buyerPhone, phoneNumber);

                    const displayName = selectedBuyer.buyerName || `+${selectedBuyer.buyerPhone}`;
                    let historyText = `💬 *PERCAKAPAN DENGAN ${displayName}*\n`;
                    historyText += `📱 ${selectedBuyer.buyerPhone}\n`;
                    historyText += `─────────────────────────\n\n`;

                    if (history.length === 0) {
                        historyText += `_Belum ada percakapan yang tersimpan._\n`;
                    } else {
                        // Tampilkan maks 15 pesan terakhir agar tidak terlalu panjang
                        const messages = history.slice(-15);
                        for (const msg of messages) {
                            const time = new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                            const date = new Date(msg.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                            const senderLabel = msg.sender === 'buyer' ? `🛒 Pembeli` : `🌾 Anda`;
                            historyText += `[${date} ${time}] ${senderLabel}:\n${msg.text}\n\n`;
                        }
                    }

                    historyText += `─────────────────────────\n`;
                    historyText += `💡 Untuk membalas, cukup ketik pesan biasa — bot akan meneruskan ke pembeli.\n`;
                    historyText += `💡 Ketik *CHAT* untuk kembali ke inbox atau *MENU* untuk menu utama.`;

                    await sendMessage(sender, { text: historyText });
                } catch (err: any) {
                    await sendMessage(sender, { text: `❌ Gagal memuat percakapan. Silakan coba lagi.` });
                }
                return;
            } else if (!isNaN(selectedIndex)) {
                await sendMessage(sender, {
                    text: `⚠️ Nomor tidak valid. Pilih antara *1* hingga *${chatState.buyers.length}*.\n\nKetik *CHAT* untuk melihat inbox lagi atau *MENU* untuk menu utama.`
                });
                return;
            }
            // Jika input bukan angka dan bukan command — lanjut ke flow normal (AI)
            chatViewStateMap.delete(phoneNumber);
        }
    }

    // 1.4. Cek jika pengguna sedang dalam alur konfirmasi Hapus Akun (Step 1 -> Step 2 -> Exec)
    if (deleteAccountStateMap.has(phoneNumber)) {
        const state = deleteAccountStateMap.get(phoneNumber)!;

        // Cek jika sudah expired (> 5 menit)
        if (Date.now() > state.expiresAt) {
            deleteAccountStateMap.delete(phoneNumber);
            await sendMessage(sender, {
                text: `⏱️ *WAKTU KONFIRMASI HABIS*\n\nWaktu konfirmasi penghapusan akun telah kadaluarsa (5 menit). Akun Juragan tetap aman.\n\n💡 Ketik *8* jika ingin memulai kembali.`
            });
            return;
        }

        // TAHAP 1: Menunggu balasan "YAKIN HAPUS"
        if (state.step === 1) {
            if (cleanText === 'yakin hapus' || cleanText === 'yakin') {
                const securityCode = Math.floor(1000 + Math.random() * 9000).toString();
                deleteAccountStateMap.set(phoneNumber, {
                    step: 2,
                    code: securityCode,
                    expiresAt: Date.now() + 5 * 60 * 1000,
                });

                const step2Text = `🚨 *KONFIRMASI TERAKHIR (FINAL CHECK)* 🚨\n\n` +
                    `Untuk memastikan ini BENAR-BENAR Anda dan bukan tidak sengaja, silakan ketik balasan TEPAT berikut:\n\n` +
                    `👉 *KONFIRMASI ${securityCode}*\n\n` +
                    `_Catatan: Kode konfirmasi ini berlaku selama 5 menit. Ketik *BATAL* untuk membatalkan._`;
                await sendMessage(sender, { text: step2Text });
                return;
            } else {
                await sendMessage(sender, {
                    text: `⚠️ Balasan tidak dikenali.\n\nJika Juragan yakin ingin menghapus akun, ketik: *YAKIN HAPUS*\nJika ingin membatalkan, ketik: *BATAL*`
                });
                return;
            }
        }

        // TAHAP 2: Menunggu balasan "KONFIRMASI <KODE>"
        if (state.step === 2) {
            if (cleanText.startsWith('konfirmasi')) {
                const inputCode = cleanText.replace('konfirmasi', '').trim();
                if (inputCode === state.code) {
                    // Eksekusi Hapus Akun
                    try {
                        const deleteRes = await apiService.deleteUserAccount(phoneNumber);
                        deleteAccountStateMap.delete(phoneNumber);

                        if (deleteRes.success) {
                            const successText = `✅ *AKUN & DATA TERHAPUS*\n\n` +
                                `Akun Mitra Tumbasna dan seluruh riwayat data Juragan (*+${phoneNumber}*) telah berhasil dihapus dari sistem kami.\n\n` +
                                `Terima kasih pernah menjadi bagian dari Mitra Tumbasna. Jika ingin bergabung kembali di masa depan, Juragan dapat mendaftar ulang kapan saja via WhatsApp ini. 🌾`;
                            await sendMessage(sender, { text: successText });
                        } else {
                            const failText = `⚠️ *PENGHAPUSAN AKUN GAGAL*\n\n` +
                                `${deleteRes.error || 'Terjadi kesalahan saat menghapus data Anda.'}\n\n` +
                                `💡 Akun Juragan tetap aman. Silakan hubungi CS (*6*) jika membutuhkan bantuan.`;
                            await sendMessage(sender, { text: failText });
                        }
                    } catch (err: any) {
                        deleteAccountStateMap.delete(phoneNumber);
                        await sendMessage(sender, {
                            text: `❌ Terjadi kesalahan sistem saat menghapus akun: ${err.message}. Silakan coba lagi nanti.`
                        });
                    }
                    return;
                } else {
                    await sendMessage(sender, {
                        text: `❌ Kode konfirmasi tidak cocok.\n\nHarap ketik persis: *KONFIRMASI ${state.code}*\natau ketik *BATAL* untuk membatalkan.`
                    });
                    return;
                }
            }
        }
    }

    // 1.5. Cek jika pengguna sedang dalam alur konfirmasi Hapus Produk (YA / BATAL)
    if (deleteProductStateMap.has(phoneNumber)) {
        const state = deleteProductStateMap.get(phoneNumber)!;

        if (Date.now() > state.expiresAt) {
            deleteProductStateMap.delete(phoneNumber);
            await sendMessage(sender, {
                text: `⏱️ *WAKTU KONFIRMASI HABIS*\n\nWaktu konfirmasi penghapusan produk telah kadaluarsa (5 menit). Produk tetap aktif.\n\n💡 Ketik *3* jika ingin memilih produk kembali.`
            });
            return;
        }

        if (cleanText === 'ya' || cleanText === 'ya hapus' || cleanText === 'setuju') {
            try {
                const deleteRes = await apiService.deleteCommodityEntry(state.entryId, phoneNumber);
                deleteProductStateMap.delete(phoneNumber);

                if (deleteRes.success) {
                    const successText = `✅ *PRODUK BERHASIL DIHAPUS*\n\n` +
                        `Listing komoditas *${state.commodityName.toUpperCase()}* (${state.qty} kg) telah berhasil dihapus/dibatalkan dari sistem Tumbasna.\n\n` +
                        `💡 Ketik *3* untuk melihat sisa listing komoditas Anda atau *MENU* untuk ke menu utama.`;
                    await sendMessage(sender, { text: successText });
                } else {
                    const failText = `⚠️ *PENGHAPUSAN PRODUK GAGAL*\n\n` +
                        `${deleteRes.error || 'Terjadi kesalahan saat menghapus produk.'}\n\n` +
                        `💡 Ketik *3* untuk melihat daftar komoditas Anda.`;
                    await sendMessage(sender, { text: failText });
                }
            } catch (err: any) {
                deleteProductStateMap.delete(phoneNumber);
                await sendMessage(sender, {
                    text: `❌ Terjadi kesalahan sistem saat menghapus produk: ${err.message}. Silakan coba lagi nanti.`
                });
            }
            return;
        } else {
            await sendMessage(sender, {
                text: `⚠️ Balasan tidak dikenali.\n\nBalas *YA* untuk menghapus produk *${state.commodityName.toUpperCase()}*, atau ketik *BATAL* untuk membatalkan.`
            });
            return;
        }
    }

    // 1.6. Cek jika pesan adalah konfirmasi pengiriman barang "KIRIM TRX-xxxxxx"
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

    // 1.6. Cek perintah hapus produk spesifik "HAPUS PRODUK <N>" atau "BATAL PRODUK <N>"
    const deleteProductMatch = cleanText.match(/^(?:hapus|batal)\s+(?:produk\s+)?(\d+)$/i);
    if (deleteProductMatch) {
        const productIndex = parseInt(deleteProductMatch[1], 10) - 1;
        try {
            const result = await apiService.getUserEntries(phoneNumber);
            const activeEntries = result.data ? result.data.filter((e: any) => e.status === 'ACTIVE') : [];

            if (productIndex >= 0 && productIndex < activeEntries.length) {
                const targetEntry = activeEntries[productIndex];
                deleteProductStateMap.set(phoneNumber, {
                    entryId: targetEntry.id,
                    commodityName: targetEntry.commodity,
                    qty: targetEntry.remainingQty || targetEntry.originalQty,
                    price: targetEntry.price,
                    expiresAt: Date.now() + 5 * 60 * 1000
                });

                const confirmText = `⚠️ *KONFIRMASI HAPUS PRODUK* ⚠️\n\n` +
                    `Apakah Juragan yakin ingin menghapus/membatalkan listing komoditas berikut dari pasar Tumbasna?\n\n` +
                    `• Komoditas: *${targetEntry.commodity.toUpperCase()}*\n` +
                    `• Sisa Stok: *${targetEntry.remainingQty || targetEntry.originalQty} kg*\n` +
                    `• Harga: *Rp ${Number(targetEntry.price).toLocaleString('id-ID')}/kg*\n` +
                    `• Lokasi: ${targetEntry.location}\n\n` +
                    `👉 Balas *YA* untuk menghapus produk ini.\n` +
                    `👉 Balas *BATAL* untuk membatalkan.`;
                await sendMessage(sender, { text: confirmText });
            } else {
                await sendMessage(sender, {
                    text: `⚠️ Nomor produk tidak ditemukan.\n\nSilakan ketik *3* untuk melihat daftar komoditas aktif Anda beserta nomor urutnya.`
                });
            }
        } catch (err: any) {
            await sendMessage(sender, {
                text: `❌ Gagal mengambil daftar produk: ${err.message}`
            });
        }
        return;
    }

    // 2. Tampilkan Menu Cepat (Numeric / Keyword Shortcuts)
    const menuKeywords = ['menu', 'help', 'bantuan', 'hallo', 'halo', 'p'];
    const numberKeywords = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'profil', 'rekening', 'saldo', 'listing', 'produk', 'pesanan', 'order', 'jual', 'tambah', 'cs', 'bantuan', 'edit', 'ubah', 'hapus akun', 'hapus data', 'chat', 'inbox'];

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
                    `*7* ✏️ Edit Profil / Rekening Bank\n` +
                    `*8* 🗑️ Hapus Akun & Data Saya\n` +
                    `*9* 💬 Inbox Chat Pembeli\n\n` +
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
                    const activeEntries = result.data ? result.data.filter((e: any) => e.status === 'ACTIVE') : [];
                    if (result.success && activeEntries.length > 0) {
                        let listText = `*DAFTAR KOMODITAS JURAGAN* 📦\n\n`;
                        activeEntries.forEach((entry: any, index: number) => {
                            listText += `${index + 1}. *${entry.commodity.toUpperCase()}* [${entry.status}]\n`;
                            listText += `   - Stok Sisa: *${entry.remainingQty} kg* (Stok Awal: ${entry.originalQty} kg)\n`;
                            listText += `   - Harga: *Rp ${entry.price.toLocaleString('id-ID')}/kg*\n`;
                            listText += `   - Lokasi: ${entry.location}\n`;
                            listText += `   👉 _Ketik *HAPUS PRODUK ${index + 1}* untuk membatalkan listing ini._\n\n`;
                        });
                        listText += `💡 Ketik *MENU* untuk kembali ke menu utama.`;
                        await sendMessage(sender, { text: listText });
                    } else {
                        await sendMessage(sender, { text: "Juragan belum memiliki catatan penawaran komoditas aktif di sistem kami.\n\n💡 Ketik *MENU* untuk kembali ke menu utama." });
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

            if (cleanText === '8' || cleanText === 'hapus akun' || cleanText === 'hapus data') {
                deleteAccountStateMap.set(phoneNumber, {
                    step: 1,
                    expiresAt: Date.now() + 5 * 60 * 1000
                });

                const warningText = `⚠️ *PERINGATAN BAHAYA: HAPUS AKUN & DATA* ⚠️\n\n` +
                    `Juragan *${userInfo.name || pushName}*, tindakan ini akan menghapus akun Anda secara PERMANEN:\n` +
                    `• Profil & Rekening Bank akan dihapus dari sistem\n` +
                    `• Seluruh Daftar Komoditas Jual/Beli akan dicabut\n` +
                    `• Saldo Escrow & Riwayat Transaksi akan dibersihkan\n\n` +
                    `Apakah Juragan BENAR-BENAR YAKIN ingin melanjutkan?\n\n` +
                    `👉 Balas *YAKIN HAPUS* untuk melanjutkan ke konfirmasi final.\n` +
                    `👉 Balas *BATAL* untuk membatalkan proses ini.`;
                await sendMessage(sender, { text: warningText });
                return;
            }

            if (cleanText === '9' || cleanText === 'chat' || cleanText === 'inbox') {
                try {
                    const recentChats = await apiService.getRecentChatsForSupplier(phoneNumber);

                    if (!recentChats || recentChats.length === 0) {
                        await sendMessage(sender, {
                            text: `💬 *INBOX CHAT PEMBELI*\n\nBelum ada pembeli yang menghubungi Juragan dalam 7 hari terakhir.\n\n💡 Ketik *MENU* untuk kembali ke menu utama.`
                        });
                        return;
                    }

                    // Simpan state ke map (berlaku 10 menit)
                    chatViewStateMap.set(phoneNumber, {
                        buyers: recentChats.map((c: any) => ({
                            buyerPhone: c.buyerPhone,
                            buyerName: c.buyerName || null,
                            lastMessage: c.lastMessage || c.text || '',
                            lastTime: c.lastTime || c.createdAt || '',
                        })),
                        expiresAt: Date.now() + 10 * 60 * 1000
                    });

                    let inboxText = `💬 *INBOX CHAT PEMBELI* 📥\n\n`;
                    inboxText += `Pembeli yang menghubungi Juragan (7 hari terakhir):\n`;
                    inboxText += `─────────────────────────\n\n`;

                    recentChats.forEach((chat: any, idx: number) => {
                        const name = chat.buyerName ? `*${chat.buyerName}*` : `📱 ${chat.buyerPhone}`;
                        const lastMsg = (chat.lastMessage || chat.text || '').substring(0, 60);
                        const truncated = (chat.lastMessage || chat.text || '').length > 60 ? '...' : '';
                        const timeAgo = chat.lastTime
                            ? (() => {
                                const diff = Date.now() - new Date(chat.lastTime).getTime();
                                const hours = Math.floor(diff / 3600000);
                                const days = Math.floor(diff / 86400000);
                                if (days > 0) return `${days} hari lalu`;
                                if (hours > 0) return `${hours} jam lalu`;
                                return 'Baru saja';
                            })()
                            : '';

                        inboxText += `*${idx + 1}.* ${name}\n`;
                        inboxText += `   📝 _"${lastMsg}${truncated}"_\n`;
                        if (timeAgo) inboxText += `   ⏰ ${timeAgo}\n`;
                        inboxText += `\n`;
                    });

                    inboxText += `─────────────────────────\n`;
                    inboxText += `👉 Balas dengan *nomor urut* untuk lihat percakapan lengkap.\n`;
                    inboxText += `👉 Ketik *BATAL* untuk kembali ke menu.`;

                    await sendMessage(sender, { text: inboxText });
                } catch (err: any) {
                    console.error(`❌ [CHAT INBOX ERROR] ${err.message}`);
                    await sendMessage(sender, { text: `❌ Gagal memuat inbox chat. Silakan coba lagi nanti.` });
                }
                return;
            }
        } else {
            // Jika user BELUM terdaftar di database
            if (menuKeywords.includes(cleanText)) {
                const localPhone2 = '0' + phoneNumber.replace(/^62/, '');
                const registerMenuText =
                    `*SELAMAT DATANG DI MITRA TUMBASNA* 🌾\n\n` +
                    `Layanan WhatsApp ini digunakan oleh *Mitra Petani/Supplier* untuk memasarkan komoditas pertanian langsung ke pedagang pasar.\n\n` +
                    `Nomor Anda (*${localPhone2}*) belum terdaftar. Pendaftaran hanya 3 langkah mudah:\n\n` +
                    `*Langkah 1 — Nama:*\n` +
                    `Balas pesan ini dengan nama lengkap & nama usaha Anda.\n` +
                    `Contoh: _Pak Sugeng — Kebun Makmur Wonosobo_\n\n` +
                    `*Langkah 2 — Lokasi Kebun/Gudang:*\n` +
                    `Kirim titik lokasi menggunakan fitur Share Location WhatsApp:\n` +
                    `1️⃣ Tekan ikon 📎 (Lampiran)\n` +
                    `2️⃣ Pilih *Lokasi*\n` +
                    `3️⃣ Pilih *Kirim Lokasi Saat Ini*\n` +
                    `⚠️ Jangan ketik nama kota saja — harus pakai tombol Share Location.\n\n` +
                    `*Langkah 3 — Rekening Bank:*\n` +
                    `Kirim nama bank & nomor rekening untuk pencairan dana.\n` +
                    `Contoh: _BRI 123456789012_\n\n` +
                    `Mulai sekarang! Balas dengan nama Anda untuk memulai pendaftaran. 🤝`;
                await sendMessage(sender, { text: registerMenuText });
            } else {
                const registerHintText =
                    `⚠️ *Nomor Belum Terdaftar*\n\n` +
                    `Nomor Anda belum ada di sistem Tumbasna. Silakan daftar dulu — cukup 3 langkah:\n\n` +
                    `*1.* Ketik nama lengkap & nama usaha Anda\n` +
                    `*2.* Kirim lokasi via Share Location (📎 → Lokasi → Kirim Lokasi Saat Ini)\n` +
                    `*3.* Kirim nama bank & nomor rekening\n\n` +
                    `Mulai dengan membalas nama Anda sekarang!`;
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
            const businessName = parsedData.business_name || parsedData.farm_name || name;
            const location = parsedData.supplier_location || '';
            const bankName = parsedData.bank_name || '';
            const bankAccount = parsedData.bank_account || '';

            console.log(`📋 [REGISTER DEBUG] Attempting registration:`, {
                phone, name, businessName, location, bankName, bankAccount,
                hasName: !!name, hasLocation: !!location, hasPhone: !!phone
            });
            if (name && location && phone) {
                try {
                    console.log(`🚀 [REGISTER] Calling apiService.registerSupplier...`);
                    const result = await apiService.registerSupplier({ 
                        phone, 
                        name, 
                        businessName,
                        location, 
                        bankName, 
                        bankAccount,
                        lat: embeddedLat,
                        lng: embeddedLng
                    });
                    console.log(`✅ [REGISTER] Supplier ${name} berhasil didaftarkan:`, result);
                    if (result.success !== false) {
                        const menuText =
                            `*MENU UTAMA MITRA TUMBASNA* 🌾\n\n` +
                            `Halo Bpk/Ibu *${name}*, selamat datang! Akun Anda sudah aktif. Ketik kode angka berikut:\n\n` +
                            `*1* 👤 Lihat Profil & Rekening Bank\n` +
                            `*2* 💰 Lihat Saldo Escrow QRIS\n` +
                            `*3* 📦 Lihat Daftar Listing Produk Aktif\n` +
                            `*4* 🛒 Lihat Pesanan Masuk (Order)\n` +
                            `*5* ✍️ Cara Jual / Daftarkan Komoditas\n` +
                            `*6* 📞 Hubungi Bantuan / CS\n` +
                            `*7* ✏️ Edit Profil / Rekening Bank\n` +
                            `*8* 🗑️ Hapus Akun & Data Saya\n` +
                            `*9* 💬 Inbox Chat Pembeli\n\n` +
                            `💡 _Atau Juragan bisa langsung mengetik pesan teks bebas untuk menawarkan hasil tani Juragan secara otomatis._`;

                        parsedData.reply_message = `🎉 *REGISTRASI BERHASIL!*\n\n` +
                            `Selamat datang di Tumbasna, *${name}*!\n\n` +
                            `Data Anda telah tersimpan:\n` +
                            `📍 Lokasi: ${location}\n` +
                            `📞 Telepon: ${phone}\n` +
                            (bankName ? `🏦 Bank: ${bankName}\n` : '') +
                            (bankAccount ? `💳 No. Rek: ${bankAccount}\n` : '') +
                            `\n✅ Akun Anda sudah aktif! Berikut menu yang tersedia:`;

                        // Kirim pesan sukses dulu, lalu otomatis kirim menu
                        await sendMessage(sender, { text: parsedData.reply_message });
                        await sendMessage(sender, { text: menuText });
                        parsedData.reply_message = ''; // sudah dikirim manual, skip final reply
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

                // Skip jika item masih pending approval
                if ((item as any).pending_approval) {
                    console.log(`[SKIP] Item ${item.commodity} pending approval, tidak dikirim ke API`);
                    continue;
                }

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

        // ─── COMMODITY_REQUEST: Submit Request Komoditas Baru ───
        if (parsedData.intent === 'COMMODITY_REQUEST' && parsedData.status === 'COMPLETE' && parsedData.items.length > 0) {
            try {
                for (const item of parsedData.items) {
                    const requestPayload = {
                        commodityName: item.commodity,
                        supplierPhone: phoneNumber,
                        supplierName: userInfo?.name || pushName,
                        weightKg: item.weight_kg,
                        pricePerKg: item.price,
                        location: item.location,
                        category: 'pertanian' // default category
                    };

                    const result = await apiService.submitCommodityRequest(requestPayload);
                    console.log(`✅ [COMMODITY_REQUEST] Request submitted for ${item.commodity}:`, result);
                }

                // Clear session setelah request sukses
                const { saveSessionHistory } = await import('../ai/memory');
                await saveSessionHistory(sender, [], true);
            } catch (err: any) {
                console.error(`❌ [COMMODITY_REQUEST ERROR] Gagal submit request:`, err.message);
                parsedData.reply_message = `Maaf, terjadi kesalahan saat mengirim pengajuan komoditas. Silakan coba lagi nanti.`;
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

        // Jika sudah dikirim manual di handler REGISTER, parsedData.reply_message dikosongkan — skip
        if (!finalReply || !finalReply.trim()) {
            if (parsedData.intent === 'REGISTER' && parsedData.status === 'COMPLETE') {
                console.log(`💬 Balasan REGISTER COMPLETE sudah dikirim manual, skip.`);
                return;
            }
            finalReply = "Halo Juragan! Ada yang bisa saya bantu terkait penawaran hasil tani atau pesanan komoditas Anda? 🌾";
        }

        if (anyMatched) {
            finalReply += '\n\n*KABAR BAIK!* Kami langsung menemukan kecocokan yang pas untuk Anda di sistem!';
            if (matchedPhoneDetails) {
                finalReply += `\nSilakan klik nomor kontak partner Anda di bawah ini untuk berkoordinasi:${matchedPhoneDetails}`;
            }
        }

        // Tambahkan petunjuk MENU hanya jika user terdaftar dan bukan sedang dalam alur REGISTER
        if (isRegistered && parsedData.intent !== 'REGISTER') {
            finalReply += '\n\n💡 _Ketik *MENU* untuk melihat menu cepat atau bantuan._';
        }

        await sendMessage(sender, { text: finalReply });
        console.log(`💬 Balasan dikirim ke ${sender} (Intent: ${parsedData.intent}, Status: ${parsedData.status})`);

    } catch (parseError: any) {
        console.error(`❌ [ERROR] Processing gagal:`, parseError.message);
        await sendMessage(sender, { text: 'Maaf, terjadi kesalahan teknis. Mohon coba lagi nanti.' });
    }
}
