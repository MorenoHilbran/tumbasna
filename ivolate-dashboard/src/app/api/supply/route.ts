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
      console.error('[API SUPPLY] Geocoding failed:', geoError);
    }

    // 1. Find or Create User (Role: PETANI)
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {}, 
      create: {
        phoneNumber: phone,
        role: 'PETANI',
      },
    });

    // 2. Create Supply Entry
    const supplyEntry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: 'SUPPLY',
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
    // Cari demand yang komoditasnya sama, status ACTIVE, dan harganya >= harga supply (pembeli bersedia bayar lebih/sama),
    // Diurutkan dari harga termahal (pembeli yang berani bayar paling mahal)
    const matchedDemand = await prisma.productEntry.findFirst({
      where: {
        type: 'DEMAND',
        commodity: { contains: commodity.toLowerCase(), mode: 'insensitive' },
        status: 'ACTIVE',
        price: { gte: Number(price) },
        userId: { not: user.id } // Jangan match dengan diri sendiri
      },
      orderBy: { price: 'desc' },
      include: { user: true }
    });

    if (matchedDemand) {
      // Buat log Match di DB
      await prisma.match.create({
        data: {
          code: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          supplyEntryId: supplyEntry.id,
          demandEntryId: matchedDemand.id,
          status: 'PENDING',
          notifiedAt: new Date()
        }
      });

      // Update status menjadi MATCHED
      await prisma.productEntry.updateMany({
        where: { id: { in: [supplyEntry.id, matchedDemand.id] } },
        data: { status: 'MATCHED' }
      });

      // 4. KIRIM PUSH NOTIFICATION VIA WA BOT
      try {
        const messageToSeller = `🎉 *MATCH FOUND! (Pembeli Ditemukan)*\n\nDitemukan Pedagang yang mencari ${matchedDemand.commodity}:\n- Volume yg dicari: ${matchedDemand.qty}kg\n- Harga Target: Rp${matchedDemand.price}\n- Lokasi: ${matchedDemand.location}\n\nHubungi Pedagang lewat nomor ini: wa.me/${matchedDemand.user.phoneNumber}`;
        
        const reqSeller = fetch('http://127.0.0.1:3002/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: phone, // nomor si Petani
            message: messageToSeller
          })
        }).then(res => res.text()).catch(e => `Gagal reqSeller: ${e.message}`);

        const messageToBuyer = `🎉 *MATCH FOUND! (Pasokan Ditemukan)*\n\nAda Petani yang baru saja menawarkan ${supplyEntry.commodity} sesuai kebutuhan Anda!\n- Volume: ${supplyEntry.qty}kg\n- Harga Jual: Rp${supplyEntry.price}\n- Lokasi Petani: ${supplyEntry.location}\n\nHubungi Petani lewat nomor ini: wa.me/${user.phoneNumber}`;
        
        const reqBuyer = fetch('http://127.0.0.1:3002/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: matchedDemand.user.phoneNumber, // nomor si Pedagang
            message: messageToBuyer
          })
        }).then(res => res.text()).catch(e => `Gagal reqBuyer: ${e.message}`);

        // Wajib ditunggu (await) agar proses fetch tidak dipotong Next.js
        const [resBuyer, resSeller] = await Promise.all([reqBuyer, reqSeller]);
        console.log('[API SUPPLY] ✅ Push notification Match dikirim ke bot WA.', 'ResBuyer:', resBuyer, '| ResSeller:', resSeller);
      } catch (err) {
        console.error('[API SUPPLY] ❌ Failed to send push notification via bot', err);
      }
    }

    return NextResponse.json({ success: true, data: supplyEntry, matched: matchedDemand || null }, { status: 201 });
  } catch (error: any) {
    console.error('[API SUPPLY ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

