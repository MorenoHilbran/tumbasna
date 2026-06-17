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

    // --- New: Handle Commands (AMBIL, SUKSES, BATAL) ---
    const upperMsg = message.toUpperCase().trim();
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
        const supplyPrice  = entry.type === 'SUPPLY' ? entry.price : candidate.price;
        const demandPrice  = entry.type === 'DEMAND' ? entry.price : candidate.price;

        if (demandPrice > 0 && supplyPrice / demandPrice > MAX_PRICE_PREMIUM_RATIO) continue;

        // 3. Weighted score: lower is better
        //    Distance score  = normalised against MAX_DISTANCE_KM (0–1)
        //    Price score     = normalised price ratio above 1.0 (0–1 within 15% band)
        const distanceScore = distanceKm / MAX_DISTANCE_KM;
        const priceScore    = demandPrice > 0
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
