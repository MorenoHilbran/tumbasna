import prisma from './prisma';

/**
 * Helper function to send message back via Fonnte API
 */
export async function sendFonnteMessage(target: string, message: string) {
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
        countryCode: "62"
      })
    });

    return await response.json();
  } catch (error) {
    console.error("Failed to send Fonnte message:", error);
  }
}

/**
 * Generate a unique transaction code like TRX-1234
 */
export async function generateTransactionCode(): Promise<string> {
  let code = '';
  let exists = true;
  
  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000);
    code = `TRX-${random}`;
    const check = await prisma.match.findUnique({
      where: { code }
    });
    if (!check) exists = false;
  }
  
  return code;
}

/**
 * Tahap 1: Send offer to buyer
 */
export async function sendOfferToBuyer(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      supplyEntry: { include: { user: true } },
      demandEntry: { include: { user: true } },
    }
  });

  if (!match || !match.code) return;

  const buyer = match.demandEntry.user;
  const seller = match.supplyEntry.user;
  const commodity = match.supplyEntry.commodity;
  const qty = match.supplyEntry.qty;
  const price = match.supplyEntry.price;
  const location = match.supplyEntry.location;

  const message = `Halo Bpk/Ibu ${buyer.name || ''}, kami menemukan pasokan yang Anda cari!\\n\\n📦 ${commodity.toUpperCase()}: ${qty} kg\\n📍 Dari: ${seller.name || 'Petani'} (${location})\\n💰 Harga: Rp ${price.toLocaleString('id-ID')}/kg\\n\\nApakah Anda berminat mengambil pasokan ini?\\nBalas pesan ini dengan ketik:\\nAMBIL ${match.code}`;

  await sendFonnteMessage(buyer.phoneNumber, message);

  await prisma.match.update({
    where: { id: matchId },
    data: { notifiedAt: new Date() }
  });
}

/**
 * Tahap 2 & 3: Handle "AMBIL TRX-xxxx"
 */
export async function handleAmbiCommand(phoneNumber: string, trxCode: string) {
  const match = await prisma.match.findUnique({
    where: { code: trxCode },
    include: {
      supplyEntry: { include: { user: true } },
      demandEntry: { include: { user: true } },
    }
  });

  if (!match) {
    await sendFonnteMessage(phoneNumber, "Maaf, kode transaksi tersebut tidak ditemukan.");
    return;
  }

  // Ensure the one replying is the buyer
  if (match.demandEntry.user.phoneNumber !== phoneNumber) {
    await sendFonnteMessage(phoneNumber, "Maaf, Anda tidak terdaftar sebagai pemesan untuk transaksi ini.");
    return;
  }

  if (match.status !== 'PENDING') {
    await sendFonnteMessage(phoneNumber, `Transaksi ${trxCode} sudah diproses sebelumnya (Status: ${match.status}).`);
    return;
  }

  // Update status to MATCHED
  const updated = await prisma.match.update({
    where: { id: match.id },
    data: { status: 'MATCHED' }
  });

  // Update product entries to MATCHED to hide them from GIS/other offers
  await prisma.productEntry.update({
    where: { id: match.supplyEntryId },
    data: { status: 'MATCHED' }
  });
  await prisma.productEntry.update({
    where: { id: match.demandEntryId },
    data: { status: 'MATCHED' }
  });

  const buyer = match.demandEntry.user;
  const seller = match.supplyEntry.user;

  // Send contact swap
  const msgToBuyer = `Match Berhasil! 🎉\\n\\nSilakan hubungi Bpk/Ibu ${seller.name} (${seller.phoneNumber}) untuk koordinasi pembayaran dan pengiriman.\\nwa.me/${seller.phoneNumber}`;
  const msgToSeller = `Kabar baik! Pasokan ${match.supplyEntry.commodity} Anda diminati oleh ${buyer.name}.\\n\\nSilakan hubungi pembeli di wa.me/${buyer.phoneNumber} untuk langkah selanjutnya.`;

  await sendFonnteMessage(buyer.phoneNumber, msgToBuyer);
  await sendFonnteMessage(seller.phoneNumber, msgToSeller);

  return updated;
}

/**
 * Tahap 4: Handle "SUKSES TRX-xxxx" or "BATAL TRX-xxxx"
 */
export async function handleConfirmationCommand(phoneNumber: string, trxCode: string, success: boolean) {
  const match = await prisma.match.findUnique({
    where: { code: trxCode },
    include: {
      supplyEntry: true,
      demandEntry: true,
    }
  });

  if (!match) {
    await sendFonnteMessage(phoneNumber, "Maaf, kode transaksi tidak ditemukan.");
    return;
  }

  const status = success ? 'COMPLETED' : 'CANCELLED';
  
  const updated = await prisma.match.update({
    where: { id: match.id },
    data: { status }
  });

  if (success) {
    // If success, keep entries MATCHED (or mark as CLOSED/SUCCESS if you want to remove them completely)
    await prisma.productEntry.update({
      where: { id: match.supplyEntryId },
      data: { status: 'CLOSED' }
    });
    await prisma.productEntry.update({
      where: { id: match.demandEntryId },
      data: { status: 'CLOSED' }
    });
    await sendFonnteMessage(phoneNumber, "Terima kasih! Transaksi telah dicatat sebagai COMPLETED. Data ini akan membantu kami memantau stabilitas pangan.");
  } else {
    // If cancelled, return entries to ACTIVE so they can be matched again
    await prisma.productEntry.update({
      where: { id: match.supplyEntryId },
      data: { status: 'ACTIVE' }
    });
    await prisma.productEntry.update({
      where: { id: match.demandEntryId },
      data: { status: 'ACTIVE' }
    });
    await sendFonnteMessage(phoneNumber, "Transaksi telah dibatalkan. Pasokan akan tersedia kembali untuk dicarikan pasangan baru.");
  }

  return updated;
}

/**
 * Tahap 4: Automated Follow-up (To be called by a cron job)
 * Finds matches that were ACCEPTED > 24 hours ago and haven't been confirmed yet.
 */
export async function sendFollowUpMessages() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const pendingConfirmation = await prisma.match.findMany({
    where: {
      status: 'MATCHED',
      updatedAt: { lte: yesterday }
    },
    include: {
      supplyEntry: { include: { user: true } },
      demandEntry: { include: { user: true } },
    }
  });

  console.log(`Sending follow-ups for ${pendingConfirmation.length} transactions...`);

  for (const match of pendingConfirmation) {
    if (!match.code) continue;

    const buyer = match.demandEntry.user;
    const commodity = match.supplyEntry.commodity;
    
    const message = `Halo! Apakah transaksi pasokan ${commodity.toUpperCase()} (${match.code}) kemarin berhasil dilakukan?\\n\\n- Balas SUKSES ${match.code} jika barang sudah dibayar/diterima.\\n- Balas BATAL ${match.code} jika transaksi tidak jadi.`;

    await sendFonnteMessage(buyer.phoneNumber, message);
    
    // Optional: Update updatedAt so we don't spam every hour if the cron runs frequently
    await prisma.match.update({
      where: { id: match.id },
      data: { updatedAt: new Date() } 
    });
  }
}
