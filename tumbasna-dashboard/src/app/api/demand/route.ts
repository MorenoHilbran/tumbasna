import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { geocodeLocation } from '@/lib/geocoding';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, commodity, volume, price, location } = body;

    if (!phone || !commodity || !volume || !price || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Geocoding processing
    let lat = null;
    let lng = null;
    try {
      const coords = await geocodeLocation(location);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    } catch (geoError) {
      console.error('[API DEMAND] Geocoding failed:', geoError);
    }

    // 1. Find or Create User (Role: PEDAGANG)
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {},
      create: {
        phoneNumber: phone,
        role: 'PEDAGANG',
      },
    });

    // 2. Create Demand Entry
    const demandEntry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: 'DEMAND',
        commodity: commodity.toLowerCase(),
        qty: Number(volume),
        price: Number(price),
        location,
        lat,
        lng,
        status: 'ACTIVE',
      },
    });

    // 3. AUTO-MATCHING ALGORITHM
    // Cari supply yang komoditasnya sama, status ACTIVE, dan harganya <= harga demand,
    // Diurutkan dari harga termurah
    const matchedSupply = await prisma.productEntry.findFirst({
      where: {
        type: 'SUPPLY',
        commodity: { contains: commodity.toLowerCase(), mode: 'insensitive' },
        status: 'ACTIVE',
        price: { lte: Number(price) },
        userId: { not: user.id } // Jangan match dengan diri sendiri
      },
      orderBy: { price: 'asc' },
      include: { user: true }
    });

    if (matchedSupply) {
      // Buat log Match di DB
      await prisma.match.create({
        data: {
          code: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          supplyEntryId: matchedSupply.id,
          demandEntryId: demandEntry.id,
          status: 'PENDING',
          notifiedAt: new Date()
        }
      });

      // Update status menjadi MATCHED (Opsional, agar tidak dimatch ke orang lain lagi)
      await prisma.productEntry.updateMany({
        where: { id: { in: [matchedSupply.id, demandEntry.id] } },
        data: { status: 'MATCHED' }
      });

      // 4. KIRIM PUSH NOTIFICATION VIA WA BOT
      try {
        const waUrl = process.env.WHATSAPP_BOT_URL || 'http://127.0.0.1:3002';
        const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TUMBASNA_SECRET_KEY || 'tumbasna-rahasia-banget';

        const messageToBuyer = `🎉 *MATCH FOUND! (Pasokan Ditemukan)*\n\nDitemukan Petani yang menjual ${matchedSupply.commodity}:\n- Volume: ${matchedSupply.qty}kg\n- Harga: Rp${matchedSupply.price}\n- Lokasi: ${matchedSupply.location}\n\nHubungi Petani lewat nomor ini: wa.me/${matchedSupply.user.phoneNumber}`;

        const reqBuyer = fetch(`${waUrl}/api/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-secret-key': waApiKey
          },
          body: JSON.stringify({
            phone: phone, // nomor si Pedagang
            message: messageToBuyer
          })
        }).then(res => res.text()).catch(e => `Gagal reqBuyer: ${e.message}`);

        const messageToSeller = `🎉 *MATCH FOUND! (Pembeli Ditemukan)*\n\nAda Pedagang yang butuh ${matchedSupply.commodity} Anda!\n- Volume yg dicari: ${demandEntry.qty}kg\n- Lokasi Pembeli: ${demandEntry.location}\n\nHubungi Pedagang lewat nomor ini: wa.me/${user.phoneNumber}`;

        const reqSeller = fetch(`${waUrl}/api/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-secret-key': waApiKey
          },
          body: JSON.stringify({
            phone: matchedSupply.user.phoneNumber, // nomor si Petani
            message: messageToSeller
          })
        }).then(res => res.text()).catch(e => `Gagal reqSeller: ${e.message}`);

        // Wajib ditunggu (await) agar proses fetch tidak dipotong Next.js
        const [resBuyer, resSeller] = await Promise.all([reqBuyer, reqSeller]);
        console.log('[API DEMAND] ✅ Push notification Match dikirim ke bot WA.', 'ResBuyer:', resBuyer, '| ResSeller:', resSeller);
      } catch (err) {
        console.error('[API DEMAND] ❌ Failed to send push notification via bot', err);
      }
    }

    return NextResponse.json({ success: true, data: demandEntry, matched: matchedSupply || null }, { status: 201 });
  } catch (error: any) {
    console.error('[API DEMAND ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

