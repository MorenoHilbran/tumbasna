const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function cleanQuotes(str) {
  if (!str) return '';
  return str.replace(/^"+|"+$/g, '').trim();
}

async function main() {
  console.log('🌾 Executing Exact Regency Transaction Distribution...');

  // 1. Clear old orders & matches
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.match.deleteMany({});

  const docsDir = path.join(__dirname, '..', '..', 'docs');
  const banjarFile = path.join(docsDir, 'DATA UMKM - Banjarnegara.csv');
  const cilacapFile = path.join(docsDir, 'DATA UMKM SUPPLIER BUYYER CILACAP.csv');

  const banjarLines = fs.existsSync(banjarFile) ? fs.readFileSync(banjarFile, 'utf-8').split('\n').map(l => l.trim()).filter(l => l.length > 0) : [];
  const cilacapLines = fs.existsSync(cilacapFile) ? fs.readFileSync(cilacapFile, 'utf-8').split('\n').map(l => l.trim()).filter(l => l.length > 0) : [];

  const createdEntries = [];

  // Seed Banjarnegara UMKM Users & Entries
  let bIdx = 0;
  for (const line of banjarLines) {
    bIdx++;
    const cols = parseCSVLine(line);
    if (cols.length < 4) continue;
    const rawName = cleanQuotes(cols[0]);
    const rawCoords = cleanQuotes(cols[2]);
    const rawRole = cleanQuotes(cols[3]).toUpperCase();

    let lat = null, lng = null;
    if (rawCoords.includes(',')) {
      const parts = rawCoords.split(',');
      lat = parseFloat(parts[0].trim());
      lng = parseFloat(parts[1].trim());
    }
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      lat = -7.3884 + (Math.random() - 0.5) * 0.08;
      lng = 109.6939 + (Math.random() - 0.5) * 0.08;
    }

    const isSupplier = rawRole.includes('SUPPLIER');
    const phone = `628135${String(bIdx).padStart(6, '0')}`;
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: { name: rawName, businessName: rawName, address: 'Banjarnegara, Jawa Tengah', role: isSupplier ? 'PETANI' : 'PEDAGANG' },
      create: { phoneNumber: phone, name: rawName, businessName: rawName, address: 'Banjarnegara, Jawa Tengah', role: isSupplier ? 'PETANI' : 'PEDAGANG', balance: 2000000 }
    });

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: isSupplier ? 'SUPPLY' : 'DEMAND',
        commodity: isSupplier ? 'Salak Pondoh Dieng' : 'Beras Pandan Wangi',
        qty: 1000,
        price: 15000,
        location: 'Banjarnegara, Jawa Tengah',
        lat, lng, status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&q=80'
      }
    });

    createdEntries.push({ entry, user, city: 'Banjarnegara' });
  }

  // Seed Cilacap UMKM Users & Entries
  let cIdx = 0;
  for (const line of cilacapLines) {
    if (!line || line.startsWith(',,,')) continue;
    cIdx++;
    const cols = parseCSVLine(line);
    if (cols.length < 5) continue;
    const rawName = cleanQuotes(cols[0]);
    const rawCoords = cleanQuotes(cols[3]);
    const rawAddress = cleanQuotes(cols[4]);
    const rawRole = cols[5] ? cleanQuotes(cols[5]).toUpperCase() : 'SUPPLIER';

    if (!rawName || rawName.length < 2) continue;
    let lat = null, lng = null;
    if (rawCoords.includes(',')) {
      const parts = rawCoords.split(',');
      lat = parseFloat(parts[0].trim());
      lng = parseFloat(parts[1].trim());
    }
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      lat = -7.7150 + (Math.random() - 0.5) * 0.08;
      lng = 109.0150 + (Math.random() - 0.5) * 0.08;
    }

    const isSupplier = rawRole.includes('SUPPLIER');
    const phone = `628137${String(cIdx).padStart(6, '0')}`;
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: { name: rawName, businessName: rawName, address: rawAddress || 'Cilacap, Jawa Tengah', role: isSupplier ? 'PETANI' : 'PEDAGANG' },
      create: { phoneNumber: phone, name: rawName, businessName: rawName, address: rawAddress || 'Cilacap, Jawa Tengah', role: isSupplier ? 'PETANI' : 'PEDAGANG', balance: 3000000 }
    });

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: isSupplier ? 'SUPPLY' : 'DEMAND',
        commodity: 'Ikan Tenggiri Super Cilacap',
        qty: 1200,
        price: 45000,
        location: 'Cilacap, Jawa Tengah',
        lat, lng, status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80'
      }
    });

    createdEntries.push({ entry, user, city: 'Cilacap' });
  }

  // Seed Kebumen UMKM Users & Entries (Sedikit Data)
  const kebumenUsers = [
    { name: 'UD Tani Kebumen', role: 'PETANI', phone: '628138000001', comm: 'Gula Kelapa Kebumen', price: 18000, qty: 500, lat: -7.6701, lng: 109.6524 },
    { name: 'Warung Makan Kebumen', role: 'PEDAGANG', phone: '628138000002', comm: 'Gula Kelapa Kebumen', price: 18000, qty: 200, lat: -7.6751, lng: 109.6584 }
  ];

  for (const u of kebumenUsers) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phone },
      update: { name: u.name, businessName: u.name, address: 'Kebumen, Jawa Tengah', role: u.role },
      create: { phoneNumber: u.phone, name: u.name, businessName: u.name, address: 'Kebumen, Jawa Tengah', role: u.role, balance: 1000000 }
    });

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: u.role === 'PETANI' ? 'SUPPLY' : 'DEMAND',
        commodity: u.comm,
        qty: u.qty,
        price: u.price,
        location: 'Kebumen, Jawa Tengah',
        lat: u.lat, lng: u.lng, status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
      }
    });

    createdEntries.push({ entry, user, city: 'Kebumen' });
  }

  // Seed Purbalingga UMKM Users & Entries (Tinggi)
  const purbalinggaUsers = [
    { name: 'Tani Makmur Purbalingga', role: 'PETANI', phone: '628139000001', comm: 'Beras Pandan Wangi Purbalingga', price: 15500, qty: 2000, lat: -7.3884, lng: 109.3641 },
    { name: 'UD Sari Tani Purbalingga', role: 'PETANI', phone: '628139000002', comm: 'Cabai Rawit Merah', price: 32000, qty: 800, lat: -7.3984, lng: 109.3741 },
    { name: 'Pasar Segar Purbalingga', role: 'PEDAGANG', phone: '628139000003', comm: 'Beras Pandan Wangi Purbalingga', price: 15500, qty: 500, lat: -7.3784, lng: 109.3541 },
    { name: 'Koperasi Kuliner Purbalingga', role: 'PEDAGANG', phone: '628139000004', comm: 'Cabai Rawit Merah', price: 32000, qty: 300, lat: -7.4084, lng: 109.3841 }
  ];

  for (const u of purbalinggaUsers) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phone },
      update: { name: u.name, businessName: u.name, address: 'Purbalingga, Jawa Tengah', role: u.role },
      create: { phoneNumber: u.phone, name: u.name, businessName: u.name, address: 'Purbalingga, Jawa Tengah', role: u.role, balance: 2000000 }
    });

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: u.role === 'PETANI' ? 'SUPPLY' : 'DEMAND',
        commodity: u.comm,
        qty: u.qty,
        price: u.price,
        location: 'Purbalingga, Jawa Tengah',
        lat: u.lat, lng: u.lng, status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
      }
    });

    createdEntries.push({ entry, user, city: 'Purbalingga' });
  }

  // Seed Banyumas UMKM Users & Entries (Tinggi)
  const banyumasUsers = [
    { name: 'Petani Beras Banyumas', role: 'PETANI', phone: '628131000001', comm: 'Beras IR64 Banyumas', price: 13500, qty: 3000, lat: -7.5151, lng: 109.2941 },
    { name: 'Pedagang Pasar Sokaraja', role: 'PEDAGANG', phone: '628131000002', comm: 'Beras IR64 Banyumas', price: 13500, qty: 1000, lat: -7.5251, lng: 109.3041 }
  ];

  for (const u of banyumasUsers) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phone },
      update: { name: u.name, businessName: u.name, address: 'Purwokerto, Banyumas, Jawa Tengah', role: u.role },
      create: { phoneNumber: u.phone, name: u.name, businessName: u.name, address: 'Purwokerto, Banyumas, Jawa Tengah', role: u.role, balance: 3000000 }
    });

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: u.role === 'PETANI' ? 'SUPPLY' : 'DEMAND',
        commodity: u.comm,
        qty: u.qty,
        price: u.price,
        location: 'Banyumas, Jawa Tengah',
        lat: u.lat, lng: u.lng, status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=500&q=80'
      }
    });

    createdEntries.push({ entry, user, city: 'Banyumas' });
  }

  // ==========================================
  // SEED EXACT TARGET TRANSACTION COUNTS PER REGENCY
  // ==========================================
  // - Banyumas: 8 TRX (>= 5 -> HIJAU)
  // - Purbalingga: 6 TRX (>= 5 -> HIJAU)
  // - Cilacap: 10 TRX (>= 5 -> HIJAU)
  // - Banjarnegara: 2 TRX (< 5 -> MERAH)
  // - Kebumen: 1 TRX (< 5 -> MERAH)
  // - Tegal, Pemalang, Brebes: 0 TRX (0 -> ABU-ABU / Belum Ada Data)

  const cityTargetOrders = [
    { city: 'Banyumas', count: 8 },
    { city: 'Purbalingga', count: 6 },
    { city: 'Cilacap', count: 10 },
    { city: 'Banjarnegara', count: 2 },
    { city: 'Kebumen', count: 1 }
  ];

  for (const config of cityTargetOrders) {
    const city = config.city;
    const citySuppliers = createdEntries.filter(e => e.city === city && e.entry.type === 'SUPPLY');
    const cityBuyers = createdEntries.filter(e => e.city === city && e.entry.type === 'DEMAND');

    for (let i = 0; i < config.count; i++) {
      const supplyObj = citySuppliers[i % citySuppliers.length];
      const demandObj = cityBuyers[i % cityBuyers.length];

      const matchCode = `MATCH-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${i + 1}`;
      await prisma.match.create({
        data: {
          code: matchCode,
          supplyEntryId: supplyObj.entry.id,
          demandEntryId: demandObj.entry.id,
          status: 'MATCHED'
        }
      });

      const statuses = ['DIPROSES', 'DIKIRIM', 'SELESAI'];
      const orderStatus = statuses[i % statuses.length];
      const orderId = `TRX-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}${i + 1}`;

      const itemQty = 100 + i * 20;
      const pricePerKg = Number(supplyObj.entry.price);
      const shippingCost = 20000;
      const totalAmount = itemQty * pricePerKg + shippingCost;

      const order = await prisma.order.create({
        data: {
          id: orderId,
          buyerUserId: demandObj.user.id,
          supplierName: supplyObj.user.businessName || supplyObj.user.name,
          supplierLocation: `${city}, Jawa Tengah`,
          courier: 'Logistik Tumbasna Direct',
          shippingCost: shippingCost,
          totalAmount: totalAmount,
          status: orderStatus,
          paymentQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${orderId}`,
          fundsReleased: orderStatus === 'SELESAI',
          buyerAddress: `${city}, Jawa Tengah`,
          buyerPhone: demandObj.user.phoneNumber,
          buyerCity: city,
          supplierCity: city,
          shippingZone: `${city} Zone`,
          trackingTimeline: [
            { status: 'DIPROSES', note: 'Pembayaran Escrow QRIS Berhasil Diverifikasi', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
            ...(orderStatus === 'DIKIRIM' || orderStatus === 'SELESAI' ? [{ status: 'DIKIRIM', note: 'Barang Diangkut oleh Kurir Logistik Tumbasna', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() }] : []),
            ...(orderStatus === 'SELESAI' ? [{ status: 'SELESAI', note: 'Pesanan Diterima & Dana Escrow Diteruskan ke Supplier', timestamp: new Date().toISOString() }] : [])
          ]
        }
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productEntryId: supplyObj.entry.id,
          commodity: supplyObj.entry.commodity,
          price: pricePerKg,
          qty: itemQty,
          supplierName: supplyObj.user.businessName || supplyObj.user.name
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

  console.log('✨ SEEDING EXACT REGENCY TRANSACTIONS SELESAI! 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
