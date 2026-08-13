const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding exact requested regency data distribution...');

  // Clear existing orders, orderItems, matches, payments
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.match.deleteMany({});

  // 1. Definisikan User per Regency
  const regencyUsers = [
    // Banyumas (HIJAU - Tinggi)
    { name: 'Petani Beras Banyumas', phone: '628120000001', role: 'PETANI', city: 'Banyumas', address: 'Purwokerto, Banyumas, Jawa Tengah' },
    { name: 'UD Sembako Sokaraja', phone: '628120000002', role: 'PEDAGANG', city: 'Banyumas', address: 'Sokaraja, Banyumas, Jawa Tengah' },

    // Purbalingga (HIJAU - Tinggi)
    { name: 'Tani Makmur Purbalingga', phone: '628120000003', role: 'PETANI', city: 'Purbalingga', address: 'Kemangkon, Purbalingga, Jawa Tengah' },
    { name: 'Pasar Segar Purbalingga', phone: '628120000004', role: 'PEDAGANG', city: 'Purbalingga', address: 'Bobotsari, Purbalingga, Jawa Tengah' },

    // Cilacap (HIJAU - Tinggi)
    { name: 'Sentra Ikan Cilacap', phone: '628120000005', role: 'PETANI', city: 'Cilacap', address: 'Sentolokawat, Cilacap, Jawa Tengah' },
    { name: 'Resto Seafood Cilacap', phone: '628120000006', role: 'PEDAGANG', city: 'Cilacap', address: 'Cilacap Selatan, Cilacap, Jawa Tengah' },

    // Banjarnegara (MERAH - Rendah)
    { name: 'Petani Salak Banjarnegara', phone: '628120000007', role: 'PETANI', city: 'Banjarnegara', address: 'Dieng, Banjarnegara, Jawa Tengah' },
    { name: 'Pedagang Banjarnegara', phone: '628120000008', role: 'PEDAGANG', city: 'Banjarnegara', address: 'Purwonegoro, Banjarnegara, Jawa Tengah' },

    // Kebumen (MERAH - Rendah)
    { name: 'Petani Kebumen', phone: '628120000009', role: 'PETANI', city: 'Kebumen', address: 'Kebumen, Jawa Tengah' },
    { name: 'Pedagang Kebumen', phone: '628120000010', role: 'PEDAGANG', city: 'Kebumen', address: 'Gombong, Kebumen, Jawa Tengah' }
  ];

  const dbUsers = {};
  for (const u of regencyUsers) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phone },
      update: { name: u.name, businessName: u.name, address: u.address, role: u.role, verificationStatus: 'APPROVED' },
      create: { phoneNumber: u.phone, name: u.name, businessName: u.name, address: u.address, role: u.role, verificationStatus: 'APPROVED', balance: 5000000 }
    });
    dbUsers[u.phone] = user;
  }

  // 2. Product Entries per Regency
  const entries = [
    // Banyumas
    { user: dbUsers['628120000001'], city: 'Banyumas', type: 'SUPPLY', comm: 'Beras Pandan Wangi Banyumas', qty: 5000, price: 14500, lat: -7.5151, lng: 109.2941 },
    { user: dbUsers['628120000002'], city: 'Banyumas', type: 'DEMAND', comm: 'Beras Pandan Wangi Banyumas', qty: 2000, price: 14500, lat: -7.5251, lng: 109.3041 },

    // Purbalingga
    { user: dbUsers['628120000003'], city: 'Purbalingga', type: 'SUPPLY', comm: 'Cabai Rawit Merah Purbalingga', qty: 3000, price: 32000, lat: -7.3884, lng: 109.3641 },
    { user: dbUsers['628120000004'], city: 'Purbalingga', type: 'DEMAND', comm: 'Cabai Rawit Merah Purbalingga', qty: 1500, price: 32000, lat: -7.3984, lng: 109.3741 },

    // Cilacap
    { user: dbUsers['628120000005'], city: 'Cilacap', type: 'SUPPLY', comm: 'Ikan Tenggiri Super Cilacap', qty: 4000, price: 65000, lat: -7.7150, lng: 109.0150 },
    { user: dbUsers['628120000006'], city: 'Cilacap', type: 'DEMAND', comm: 'Ikan Tenggiri Super Cilacap', qty: 2500, price: 65000, lat: -7.7250, lng: 109.0250 },

    // Banjarnegara
    { user: dbUsers['628120000007'], city: 'Banjarnegara', type: 'SUPPLY', comm: 'Salak Pondoh Dieng', qty: 1200, price: 11000, lat: -7.3884, lng: 109.6939 },
    { user: dbUsers['628120000008'], city: 'Banjarnegara', type: 'DEMAND', comm: 'Salak Pondoh Dieng', qty: 500, price: 11000, lat: -7.3984, lng: 109.7039 },

    // Kebumen
    { user: dbUsers['628120000009'], city: 'Kebumen', type: 'SUPPLY', comm: 'Gula Kelapa Kebumen', qty: 800, price: 18000, lat: -7.6701, lng: 109.6524 },
    { user: dbUsers['628120000010'], city: 'Kebumen', type: 'DEMAND', comm: 'Gula Kelapa Kebumen', qty: 300, price: 18000, lat: -7.6801, lng: 109.6624 }
  ];

  const dbEntries = {};
  for (const e of entries) {
    const entry = await prisma.productEntry.create({
      data: {
        userId: e.user.id,
        type: e.type,
        commodity: e.comm,
        qty: e.qty,
        price: e.price,
        location: `${e.city}, Jawa Tengah`,
        lat: e.lat,
        lng: e.lng,
        status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
      }
    });
    dbEntries[`${e.city}_${e.type}`] = { entry, user: e.user };
  }

  // 3. Orders Distribution per Regency:
  // - Banyumas: 8 TRX (HIJAU)
  // - Purbalingga: 7 TRX (HIJAU)
  // - Cilacap: 10 TRX (HIJAU)
  // - Banjarnegara: 2 TRX (MERAH)
  // - Kebumen: 1 TRX (MERAH)
  // - Tegal, Pemalang, Brebes: 0 TRX (ABU-ABU)

  const targets = [
    { city: 'Banyumas', count: 8 },
    { city: 'Purbalingga', count: 7 },
    { city: 'Cilacap', count: 10 },
    { city: 'Banjarnegara', count: 2 },
    { city: 'Kebumen', count: 1 }
  ];

  for (const t of targets) {
    const city = t.city;
    const supObj = dbEntries[`${city}_SUPPLY`];
    const demObj = dbEntries[`${city}_DEMAND`];

    for (let i = 0; i < t.count; i++) {
      const matchCode = `MATCH-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${i + 1}`;
      await prisma.match.create({
        data: {
          code: matchCode,
          supplyEntryId: supObj.entry.id,
          demandEntryId: demObj.entry.id,
          status: 'MATCHED'
        }
      });

      const orderId = `TRX-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}${i + 1}`;
      const statuses = ['DIPROSES', 'DIKIRIM', 'SELESAI'];
      const st = statuses[i % statuses.length];
      const qty = 100 + i * 20;
      const price = Number(supObj.entry.price);
      const totalAmount = qty * price + 25000;

      const order = await prisma.order.create({
        data: {
          id: orderId,
          buyerUserId: demObj.user.id,
          supplierName: supObj.user.name,
          supplierLocation: `${city}, Jawa Tengah`,
          courier: 'Logistik Tumbasna Direct',
          shippingCost: 25000,
          totalAmount: totalAmount,
          status: st,
          paymentQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${orderId}`,
          fundsReleased: st === 'SELESAI',
          buyerAddress: `${city}, Jawa Tengah`,
          buyerPhone: demObj.user.phoneNumber,
          buyerCity: city,
          supplierCity: city,
          shippingZone: `${city} Zone`,
          trackingTimeline: [
            { status: 'DIPROSES', note: 'Pembayaran Escrow QRIS Berhasil Diverifikasi', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
            ...(st === 'DIKIRIM' || st === 'SELESAI' ? [{ status: 'DIKIRIM', note: 'Barang Diangkut oleh Kurir Logistik Tumbasna', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() }] : []),
            ...(st === 'SELESAI' ? [{ status: 'SELESAI', note: 'Pesanan Diterima & Dana Escrow Diteruskan ke Supplier', timestamp: new Date().toISOString() }] : [])
          ]
        }
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productEntryId: supObj.entry.id,
          commodity: supObj.entry.commodity,
          price: price,
          qty: qty,
          supplierName: supObj.user.name
        }
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          midtransOrderId: `MID-${orderId}`,
          paymentType: 'qris',
          grossAmount: totalAmount,
          status: 'SETTLEMENT',
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${orderId}`
        }
      });
    }
  }

  console.log('✅ SEEDING FINAL REGENCIES COMPLETE!');
}

main()
  .catch(e => { console.error('❌ Error seeding:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
