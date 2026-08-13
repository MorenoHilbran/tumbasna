import { NextResponse } from 'next/server';
import { extractMessageData } from '@/lib/gemini';
import { geocodeLocation } from '@/lib/geocoding';
import prisma from '@/lib/prisma';
import {
  handleAmbiCommand,
  handleConfirmationCommand,
  generateTransactionCode,
  sendOfferToBuyer
} from '@/lib/transactions';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 1. Support formats from common WA providers specifically Fonnte
    // Fonnte sends URL-encoded form data by default, or JSON depending on config.
    // We handle JSON payload primarily.
    const sender = payload.sender; // Fonnte uses 'sender'
    const message = payload.message; // Fonnte uses 'message'

    if (!sender || !message) {
      return NextResponse.json({ error: 'Invalid payload: missing sender or message' }, { status: 400 });
    }

    // 2. Ensure user exists (Upsert logic to register automatically)
    const user = await prisma.user.upsert({
      where: { phoneNumber: sender },
      update: {},
      create: {
        phoneNumber: sender,
        name: `User-${sender.substring(sender.length - 4)}`,
        role: message.toLowerCase().includes('panen') ? 'PETANI' : 'PEDAGANG'
      }
    });

    // --- 2.5: Handle Interactive WhatsApp Bot Menu & Numbers (1 to 9) ---
    const trimmedMsg = message.trim();
    const upperMsg = trimmedMsg.toUpperCase();
    const lowerMsg = trimmedMsg.toLowerCase();
    const cleanMsg = lowerMsg.replace(/[^a-z0-9\s]/g, '').trim();

    // Check if input is a menu trigger or exact menu option number
    const isMenuTrigger = cleanMsg === 'menu' || cleanMsg === '0' || cleanMsg === 'hallo' || cleanMsg === 'halo' || cleanMsg === 'start' || cleanMsg === 'help';

    if (isMenuTrigger) {
      const menuText = 
`*MENU UTAMA MITRA TUMBASNA* 🌾

Halo Bpk/Ibu *${user.name || 'Mitra Tumbasna'}*, selamat datang di layanan WhatsApp Mitra Tumbasna. Ketik kode angka berikut untuk menu transaksi cepat:

1 👤 Lihat Profil & Rekening Bank
2 💰 Lihat Saldo Escrow QRIS
3 📦 Lihat Daftar Listing Produk Aktif
4 🛒 Lihat Pesanan Masuk (Order)
5 ✍️ Cara Jual / Daftarkan Komoditas
6 📞 Hubungi Bantuan / CS
7 ✏️ Edit Profil / Rekening Bank
8 🗑️ Hapus Akun & Data Saya
9 💬 Inbox Chat Pembeli

💡 *Atau Juragan bisa langsung mengetik pesan teks bebas untuk menawarkan hasil tani Juragan secara otomatis.*`;

      await sendFonnteReply(sender, menuText);
      return NextResponse.json({ success: true, menu: 'MAIN_MENU' });
    }

    // Option 1: Lihat Profil & Rekening Bank
    if (cleanMsg === '1' || cleanMsg.includes('lihat profil') || cleanMsg.includes('rekening bank')) {
      const profileText = 
`👤 *PROFIL MITRA TUMBASNA*

• Nama: *${user.name || 'Belum Diisi'}*
• No. WhatsApp: *${user.phoneNumber}*
• Peran: *${user.role}*
• Alamat Usaha: *${user.address || 'Belum Diisi'}*
• Nama Bank: *${user.bankName || 'Belum Diisi'}*
• No. Rekening: *${user.bankAccount || 'Belum Diisi'}*
• Status Verifikasi: *${(user as any).verificationStatus || 'Terverifikasi (Mitra UMKM)'}*

💡 Ketik *7* untuk mengedit Profil / Rekening Bank.
💡 Ketik *MENU* untuk kembali ke menu utama.`;

      await sendFonnteReply(sender, profileText);
      return NextResponse.json({ success: true, menu: 'PROFIL' });
    }

    // Option 2: Lihat Saldo Escrow QRIS
    if (cleanMsg === '2' || cleanMsg.includes('lihat saldo') || cleanMsg.includes('saldo escrow')) {
      const activeEscrowOrders = await prisma.order.findMany({
        where: {
          supplierName: { contains: user.name || sender, mode: 'insensitive' },
          status: 'DIPROSES',
        }
      });
      const totalEscrowAmt = activeEscrowOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      const balanceText = 
`💰 *INFORMASI SALDO & ESCROW QRIS*

• Saldo Utama Aktif: *Rp ${Number(user.balance || 0).toLocaleString('id-ID')}*
• Transaksi Escrow Diproses: *${activeEscrowOrders.length} pesanan*
• Total Nominal Escrow Ditahan: *Rp ${totalEscrowAmt.toLocaleString('id-ID')}*

💡 Dana escrow otomatis dilepaskan ke saldo utama setelah barang diterima pembeli.
💡 Ketik *MENU* untuk kembali ke menu utama.`;

      await sendFonnteReply(sender, balanceText);
      return NextResponse.json({ success: true, menu: 'SALDO_ESCROW' });
    }

    // Option 3: Lihat Daftar Listing Produk Aktif
    if (cleanMsg === '3' || cleanMsg.includes('daftar listing') || cleanMsg.includes('produk aktif')) {
      const activeEntries = await prisma.productEntry.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      let listingText = `📦 *DAFTAR LISTING PRODUK AKTIF (${activeEntries.length})*\n\n`;
      if (activeEntries.length === 0) {
        listingText += `Belum ada listing produk aktif. Kirimkan pesan penawaran komoditas Anda sekarang!\n\n💡 Ketik *5* untuk panduan cara jual.`;
      } else {
        activeEntries.forEach((e, idx) => {
          listingText += `${idx + 1}. *${e.commodity.toUpperCase()}* (${e.type})\n   • Stok: ${Number(e.qty)} kg | Rp ${Number(e.price).toLocaleString('id-ID')}/kg\n   • Lokasi: ${e.location}\n\n`;
        });
        listingText += `💡 Ketik *5* untuk menambah komoditas baru.\n💡 Ketik *MENU* untuk kembali.`;
      }

      await sendFonnteReply(sender, listingText);
      return NextResponse.json({ success: true, menu: 'LISTING' });
    }

    // Option 4: Lihat Pesanan Masuk (Order)
    if (cleanMsg === '4' || cleanMsg.includes('pesanan masuk') || cleanMsg.includes('order')) {
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { supplierName: { contains: user.name || sender, mode: 'insensitive' } },
            { items: { some: { supplierName: { contains: user.name || sender, mode: 'insensitive' } } } }
          ]
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true, buyer: true }
      });

      let orderText = `🛒 *DAFTAR PESANAN MASUK (ORDER)*\n\n`;
      if (orders.length === 0) {
        orderText += `Belum ada pesanan masuk saat ini.\n\n💡 Ketik *MENU* untuk kembali ke menu utama.`;
      } else {
        orders.forEach((o, idx) => {
          const item = o.items[0];
          const bName = o.buyer?.name || o.buyer?.businessName || (o as any).buyerName || 'Pembeli Tumbasna';
          orderText += `${idx + 1}. *${o.id}* — Rp ${Number(o.totalAmount).toLocaleString('id-ID')}\n   • Pembeli: ${bName}\n   • Item: ${item?.commodity || 'Komoditas'} (${Number(item?.qty || 1)} kg)\n   • Status: ${o.status}\n\n`;
        });
        orderText += `💡 Ketik *MENU* untuk kembali ke menu utama.`;
      }

      await sendFonnteReply(sender, orderText);
      return NextResponse.json({ success: true, menu: 'ORDERS' });
    }

    // Option 5: Cara Jual / Daftarkan Komoditas
    if (cleanMsg === '5' || cleanMsg.includes('cara jual') || cleanMsg.includes('daftarkan komoditas')) {
      const guideText = 
`✍️ *PANDUAN DAFTAR & JUAL KOMODITAS*

Juragan bisa langsung mengetik pesan bebas di WhatsApp ini untuk mendaftarkan komoditas hasil tani.

*Contoh Format Pesan:*
_"Jual Beras Pandan Wangi 500 kg harga 14500 lokasi Purbalingga"_
Atau
_"Panen Cabai Rawit Merah 200 kg harga 42000 lokasi Sokaraja Banyumas"_

Sistem AI Tumbasna akan otomatis mencatat komoditas Anda dan mencarikan pembeli terdekat!

💡 Ketik *MENU* untuk kembali ke menu utama.`;

      await sendFonnteReply(sender, guideText);
      return NextResponse.json({ success: true, menu: 'CARA_JUAL' });
    }

    // Option 6: Hubungi Bantuan / CS
    if (cleanMsg === '6' || cleanMsg.includes('hubungi bantuan') || cleanMsg.includes('bantuan cs') || cleanMsg.includes('cs')) {
      const csText = 
`📞 *BANTUAN & CUSTOMER SERVICE TUMBASNA*

Butuh bantuan transaksi, kendala pengiriman kurir lokal, atau pencairan saldo Escrow?

• Hotline CS WA: *0812-3456-7890*
• Support Email: *support@tumbasna.my.id*
• Jam Operasional: *Senin - Minggu (08.00 - 20.00 WIB)*

Tim Tumbasna siap mendampingi transaksi Juragan 24/7!
💡 Ketik *MENU* untuk kembali ke menu utama.`;

      await sendFonnteReply(sender, csText);
      return NextResponse.json({ success: true, menu: 'CS_BANTUAN' });
    }

    // Option 7: Edit Profil / Rekening Bank
    if (cleanMsg === '7' || cleanMsg.includes('edit profil') || cleanMsg.includes('edit rekening')) {
      const editText = 
`✏️ *EDIT PROFIL / REKENING BANK*

Untuk memperbarui data Rekening Bank penerima pencairan saldo Escrow, kirim pesan format:
*EDIT BANK [Nama Bank] [Nomor Rekening]*
Contoh: \`EDIT BANK BCA 1234567890\`

Untuk mengubah Nama Lengkap Usaha:
*EDIT NAMA [Nama Lengkap]*
Contoh: \`EDIT NAMA Pak Kafah\`

💡 Ketik *MENU* untuk kembali ke menu utama.`;

      await sendFonnteReply(sender, editText);
      return NextResponse.json({ success: true, menu: 'EDIT_PROFIL_PROMPT' });
    }

    // Sub-handler for EDIT BANK & EDIT NAMA
    if (upperMsg.startsWith('EDIT BANK ') || upperMsg.startsWith('EDIT NAMA ')) {
      if (upperMsg.startsWith('EDIT BANK ')) {
        const parts = upperMsg.replace('EDIT BANK ', '').trim().split(/\s+/);
        const bankName = parts[0];
        const bankAccount = parts.slice(1).join(' ');
        await prisma.user.update({
          where: { id: user.id },
          data: { bankName, bankAccount }
        });
        await sendFonnteReply(sender, `✅ Rekening Bank berhasil diperbarui!\n\n• Bank: *${bankName}*\n• No Rek: *${bankAccount}*\n\n💡 Ketik *1* untuk melihat profil Anda.`);
      } else {
        const newName = message.substring(10).trim();
        await prisma.user.update({
          where: { id: user.id },
          data: { name: newName }
        });
        await sendFonnteReply(sender, `✅ Nama profil berhasil diperbarui menjadi *${newName}*!\n\n💡 Ketik *1* untuk melihat profil Anda.`);
      }
      return NextResponse.json({ success: true, menu: 'EDIT_PROFIL_SUCCESS' });
    }

    // Option 8: Hapus Akun & Data Saya
    if (cleanMsg === '8' || cleanMsg.includes('hapus akun') || cleanMsg.includes('hapus data')) {
      const confirmDeleteText = 
`🗑️ *HAPUS AKUN & DATA SAYA*

Apakah Anda yakin ingin menghapus profil dan data Mitra Tumbasna Anda?

Kirimkan pesan:
*KONFIRMASI HAPUS AKUN*

untuk mengonfirmasi penghapusan data profil Anda.
💡 Ketik *MENU* untuk membatalkan dan kembali.`;

      await sendFonnteReply(sender, confirmDeleteText);
      return NextResponse.json({ success: true, menu: 'HAPUS_AKUN_PROMPT' });
    }

    // Sub-handler for KONFIRMASI HAPUS AKUN
    if (upperMsg === 'KONFIRMASI HAPUS AKUN') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: `User-Disabled-${sender.slice(-4)}`,
          address: null,
          businessName: null,
          bankName: null,
          bankAccount: null
        }
      });
      await sendFonnteReply(sender, `✅ Profil & data akun Anda telah berhasil dihapus dari sistem Tumbasna.\n\n💡 Ketik *MENU* kapan saja jika Anda ingin mendaftar ulang.`);
      return NextResponse.json({ success: true, menu: 'HAPUS_AKUN_SUCCESS' });
    }

    // Option 9: Inbox Chat Pembeli
    if (cleanMsg === '9' || cleanMsg.includes('inbox chat') || cleanMsg.includes('chat pembeli')) {
      const buyerChats = await prisma.chatMessage.findMany({
        where: {
          supplierPhone: sender,
          sender: 'buyer'
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      let inboxText = `💬 *INBOX CHAT PEMBELI (${buyerChats.length})*\n\n`;
      if (buyerChats.length === 0) {
        inboxText += `Belum ada pesan chat dari pembeli saat ini.\n\n💡 Ketik *MENU* untuk kembali ke menu utama.`;
      } else {
        buyerChats.forEach((c, idx) => {
          inboxText += `${idx + 1}. Dari *${c.supplierName || 'Pembeli Tumbasna'}*\n   "${c.text}"\n\n`;
        });
        inboxText += `💡 Balas langsung pesan ini untuk merespons pembeli.\n💡 Ketik *MENU* untuk kembali ke menu utama.`;
      }

      await sendFonnteReply(sender, inboxText);
      return NextResponse.json({ success: true, menu: 'INBOX_CHAT' });
    }

    // --- New: Handle Commands (AMBIL, SUKSES, BATAL) ---
    if (upperMsg.startsWith('AMBIL ') || upperMsg.startsWith('SUKSES ') || upperMsg.startsWith('BATAL ')) {
      const parts = upperMsg.split(' ');
      const command = parts[0];
      const trxCode = parts[1];

      if (!trxCode || !trxCode.startsWith('TRX-')) {
        await sendFonnteReply(sender, "Format perintah salah. Contoh: AMBIL TRX-1024");
        return NextResponse.json({ error: 'Invalid command format' }, { status: 400 });
      }

      let result;
      if (command === 'AMBIL') {
        result = await handleAmbiCommand(sender, trxCode);
      } else if (command === 'SUKSES') {
        result = await handleConfirmationCommand(sender, trxCode, true);
      } else if (command === 'BATAL') {
        result = await handleConfirmationCommand(sender, trxCode, false);
      }

      return NextResponse.json({
        success: true,
        command,
        data: result
      });
    }

    // --- New: Handle Chat Balasan dari Supplier ke Buyer ---
    // Cek apakah nomor pengirim pernah menerima chat dari buyer (tabel ChatMessage dengan supplierName = sender)
    const lastChatFromBuyer = await prisma.chatMessage.findFirst({
      where: {
        supplierName: sender,
        sender: 'buyer'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Jika pesan tidak mengandung kata kunci komoditas (JUAL/BELI/PANEN) dan ada histori chat dari buyer
    const isCommodityMsg = message.toLowerCase().includes('jual') || message.toLowerCase().includes('beli') || message.toLowerCase().includes('panen');
    if (!isCommodityMsg && lastChatFromBuyer && lastChatFromBuyer.buyerUserId) {
      // Simpan balasan supplier ke tabel chat_messages
      const supplierReply = await prisma.chatMessage.create({
        data: {
          buyerUserId: lastChatFromBuyer.buyerUserId,
          supplierPhone: lastChatFromBuyer.supplierPhone || sender,
          supplierName: lastChatFromBuyer.supplierName || sender,
          sender: 'supplier',
          text: message,
          status: 'read'
        }
      });

      console.log(`[WA WEBHOOK] Balasan chat dari supplier ${sender} berhasil disimpan untuk buyer ID ${lastChatFromBuyer.buyerUserId}`);

      return NextResponse.json({
        success: true,
        type: 'CHAT_REPLY',
        data: supplierReply
      });
    }

    // 3. Extract Data using AI (Gemini)
    const extractedData = await extractMessageData(message);
    console.log("AI Extracted:", extractedData);

    if (!extractedData || extractedData.commodity === 'Unknown' || extractedData.qty === 0) {
      await sendFonnteReply(sender, "Maaf, sistem AI kami tidak dapat mengenali detail komoditas dari pesan Anda. Mohon sebutkan komoditas, jumlah, harga, dan lokasi.");
      return NextResponse.json({ error: 'Could not extract product details' }, { status: 400 });
    }

    // 4. Geocode Location (With isolated try-catch so it doesn't fail the whole DB save)
    let lat = null;
    let lng = null;
    try {
      const coords = await geocodeLocation(extractedData.location);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    } catch (geoError) {
      console.error("Geocoding failed, continuing without coords:", geoError);
    }

    // 5. Save Product Entry to DB
    let entry;
    try {
      entry = await prisma.productEntry.create({
        data: {
          userId: user.id,
          type: extractedData.type,
          commodity: extractedData.commodity.toLowerCase(),
          qty: Number(extractedData.qty) || 0,
          price: Number(extractedData.price) || 0,
          location: extractedData.location || 'Unknown',
          lat: lat,
          lng: lng,
        }
      });
    } catch (dbError) {
      console.error("Database save failed:", dbError);
      await sendFonnteReply(sender, "Terjadi kendala saat menyimpan data ke sistem. Mohon coba lagi beberapa saat.");
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 6. Smart Matching Engine (SME) (With isolated try-catch)
    // Uses Haversine distance, price tolerance filter, and weighted scoring.
    let matchedOps = 0;
    try {
      const MAX_DISTANCE_KM = 100;
      const MAX_PRICE_PREMIUM_RATIO = 1.15; // Supply price <= 115% of Demand price

      // --- Haversine Formula ---
      const haversineDistanceKm = (
        lat1: number, lng1: number,
        lat2: number, lng2: number
      ): number => {
        const R = 6371; // Earth's radius in km
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const oppositeType = entry.type === 'SUPPLY' ? 'DEMAND' : 'SUPPLY';

      const candidates = await prisma.productEntry.findMany({
        where: {
          type: oppositeType,
          commodity: entry.commodity,
          status: 'ACTIVE',
          userId: { not: user.id },
        },
      });

      // --- Filter & Score candidates ---
      type ScoredCandidate = {
        candidate: typeof candidates[0];
        distanceKm: number;
        score: number;
      };

      const scoredCandidates: ScoredCandidate[] = [];

      for (const candidate of candidates) {
        // 1. Distance filter — skip if either entry lacks coordinates
        if (
          entry.lat == null || entry.lng == null ||
          candidate.lat == null || candidate.lng == null
        ) {
          continue;
        }

        const distanceKm = haversineDistanceKm(
          Number(entry.lat), Number(entry.lng),
          Number(candidate.lat), Number(candidate.lng)
        );

        if (distanceKm > MAX_DISTANCE_KM) continue;

        // 2. Price filter — supply price must not exceed 115% of demand price
        const supplyPrice = Number(entry.type === 'SUPPLY' ? entry.price : candidate.price);
        const demandPrice = Number(entry.type === 'DEMAND' ? entry.price : candidate.price);

        if (demandPrice > 0 && supplyPrice / demandPrice > MAX_PRICE_PREMIUM_RATIO) continue;

        // 3. Weighted score: lower is better
        //    Distance score  = normalised against MAX_DISTANCE_KM (0–1)
        //    Price score     = normalised price ratio above 1.0 (0–1 within 15% band)
        const distanceScore = distanceKm / MAX_DISTANCE_KM;
        const priceScore = demandPrice > 0
          ? Math.max(0, (supplyPrice / demandPrice - 1) / 0.15)
          : 0;

        const score = 0.7 * distanceScore + 0.3 * priceScore;

        scoredCandidates.push({ candidate, distanceKm, score });
      }

      // Sort ascending by score (best match first)
      scoredCandidates.sort((a, b) => a.score - b.score);

      if (scoredCandidates.length > 0) {
        const best = scoredCandidates[0];
        console.log(
          `Smart Match: ${entry.commodity} — distance ${best.distanceKm.toFixed(1)} km, score ${best.score.toFixed(3)}`
        );

        const matchCode = await generateTransactionCode();
        const match = await prisma.match.create({
          data: {
            code: matchCode,
            supplyEntryId: entry.type === 'SUPPLY' ? entry.id : best.candidate.id,
            demandEntryId: entry.type === 'DEMAND' ? entry.id : best.candidate.id,
            status: 'PENDING',
          },
        });

        // Tahap 1: Send notification and offer to buyer
        await sendOfferToBuyer(match.id);

        matchedOps++;

        await prisma.productEntry.update({
          where: { id: best.candidate.id },
          data: { status: 'MATCHED' },
        });
        await prisma.productEntry.update({
          where: { id: entry.id },
          data: { status: 'MATCHED' },
        });
      }
    } catch (matchError) {
      console.error("Smart Matching Engine failed:", matchError);
      // We don't fail the webhook here since the data is already saved
    }

    // 7. Send success confirmation via Fonnte back to user
    const replyMessage = `✅ Data berhasil dicatat!\\nKomoditas: ${extractedData.commodity}\\nSifat: ${extractedData.type}\\nJumlah: ${extractedData.qty}\\nHarga: Rp ${extractedData.price}\\nLokasi: ${extractedData.location}\\n\\nInfo: Ditemukan ${matchedOps} kecocokan di pasar saat ini.`;

    await sendFonnteReply(sender, replyMessage);

    // Get the matches we just created (or if we want to be more specific, we can track them in an array)
    const matches = matchedOps > 0 ? await prisma.match.findMany({
      where: {
        OR: [
          { supplyEntryId: entry.id },
          { demandEntryId: entry.id }
        ]
      },
      select: {
        code: true,
        status: true
      }
    }) : [];

    return NextResponse.json({
      success: true,
      entry,
      matches,
      message: 'Product processed and matching algorithm executed'
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper function to send message back via Fonnte API
async function sendFonnteReply(target: string, message: string) {
  // If FONNTE_TOKEN is not configured, just log it so it doesn't crash local development
  if (!process.env.FONNTE_TOKEN) {
    console.warn("FONNTE_TOKEN is missing. Sending mock reply to console:", { target, message });
    return;
  }

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": process.env.FONNTE_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target: target,
        message: message,
        countryCode: "62" // default ID
      })
    });

    const data = await response.json();
    console.log("Fonnte API Response:", data);
  } catch (error) {
    console.error("Failed to send Fonnte reply:", error);
  }
}
