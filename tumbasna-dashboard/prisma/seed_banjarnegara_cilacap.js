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
  console.log('🌾 Memulai seeding data UMKM Banjarnegara, Kebumen & Cilacap...');

  // Clear existing orders & matches for fresh comparative seeding
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.match.deleteMany({});

  const docsDir = path.join(__dirname, '..', '..', 'docs');
  const banjarnegaraFile = path.join(docsDir, 'DATA UMKM - Banjarnegara.csv');
  const cilacapFile = path.join(docsDir, 'DATA UMKM SUPPLIER BUYYER CILACAP.csv');

  if (!fs.existsSync(banjarnegaraFile) || !fs.existsSync(cilacapFile)) {
    console.error('❌ CSV files not found in docs folder!');
    process.exit(1);
  }

  const banjarRaw = fs.readFileSync(banjarnegaraFile, 'utf-8');
  const banjarLines = banjarRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const cilacapRaw = fs.readFileSync(cilacapFile, 'utf-8');
  const cilacapLines = cilacapRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const banjarCommodityList = [
    { name: 'Beras Pandan Wangi Super', price: 16000, baseQty: 1500, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80' },
    { name: 'Beras IR64 Premium', price: 13500, baseQty: 2500, img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=500&q=80' },
    { name: 'Salak Pondoh Dieng', price: 11000, baseQty: 1200, img: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&q=80' },
    { name: 'Kopi Arabika Dieng', price: 95000, baseQty: 500, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80' },
    { name: 'Kentang Super Dieng', price: 14500, baseQty: 3000, img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80' }
  ];

  const cilacapCommodityList = [
    { name: 'Ikan Layur Segar Tangkapan Nelayan', price: 38000, baseQty: 1200, img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80' },
    { name: 'Ikan Tenggiri Super Cilacap', price: 85000, baseQty: 900, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' },
    { name: 'Udang Windu Beku PT Toxindo', price: 95000, baseQty: 1500, img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80' },
    { name: 'Ikan Asin Sentolo Kawat Khas', price: 35000, baseQty: 800, img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80' },
    { name: 'Kerupuk Tenggiri Mr. Mackarel', price: 45000, baseQty: 600, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' }
  ];

  const createdUsers = [];
  const createdEntries = [];

  // 1. Banjarnegara
  let bIdx = 0;
  for (const line of banjarLines) {
    bIdx++;
    const cols = parseCSVLine(line);
    if (cols.length < 4) continue;

    const rawName = cleanQuotes(cols[0]);
    const rawCoords = cleanQuotes(cols[2]);
    const rawRole = cleanQuotes(cols[3]).toUpperCase();

    let lat = null;
    let lng = null;
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
    const role = isSupplier ? 'PETANI' : 'PEDAGANG';
    const phone = `628135${String(bIdx).padStart(6, '0')}`;
    const address = `Banjarnegara, Jawa Tengah (Maps: ${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {
        name: rawName,
        businessName: rawName,
        address: address,
        businessType: isSupplier ? 'Supplier Beras & Pangan Banjarnegara' : 'Pedagang & Pembeli Banjarnegara',
        role: role
      },
      create: {
        phoneNumber: phone,
        name: rawName,
        businessName: rawName,
        address: address,
        businessType: isSupplier ? 'Supplier Beras & Pangan Banjarnegara' : 'Pedagang & Pembeli Banjarnegara',
        role: role,
        balance: isSupplier ? 2500000 : 0
      }
    });

    createdUsers.push({ user, city: 'Banjarnegara', lat, lng, isSupplier });

    const commItem = banjarCommodityList[(bIdx - 1) % banjarCommodityList.length];
    const qty = commItem.baseQty + Math.floor(Math.random() * 500);

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: isSupplier ? 'SUPPLY' : 'DEMAND',
        commodity: commItem.name,
        qty: qty,
        price: commItem.price,
        location: 'Banjarnegara, Jawa Tengah',
        lat: lat,
        lng: lng,
        status: 'ACTIVE',
        image: commItem.img
      }
    });

    createdEntries.push({ entry, user, city: 'Banjarnegara' });
  }

  // 2. Cilacap
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

    let lat = null;
    let lng = null;
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
    const role = isSupplier ? 'PETANI' : 'PEDAGANG';
    const phone = `628137${String(cIdx).padStart(6, '0')}`;
    const address = rawAddress || `Cilacap, Jawa Tengah (Maps: ${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {
        name: rawName,
        businessName: rawName,
        address: address,
        businessType: isSupplier ? 'Supplier Hasil Laut & Perikanan Cilacap' : 'Restoran & Pedagang Seafood Cilacap',
        role: role
      },
      create: {
        phoneNumber: phone,
        name: rawName,
        businessName: rawName,
        address: address,
        businessType: isSupplier ? 'Supplier Hasil Laut & Perikanan Cilacap' : 'Restoran & Pedagang Seafood Cilacap',
        role: role,
        balance: isSupplier ? 3500000 : 0
      }
    });

    createdUsers.push({ user, city: 'Cilacap', lat, lng, isSupplier });

    const commItem = cilacapCommodityList[(cIdx - 1) % cilacapCommodityList.length];
    const qty = commItem.baseQty + Math.floor(Math.random() * 400);

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: isSupplier ? 'SUPPLY' : 'DEMAND',
        commodity: commItem.name,
        qty: qty,
        price: commItem.price,
        location: 'Cilacap, Jawa Tengah',
        lat: lat,
        lng: lng,
        status: 'ACTIVE',
        image: commItem.img
      }
    });

    createdEntries.push({ entry, user, city: 'Cilacap' });
  }

  // 3. Kebumen (Sedikit data: 2 Suppliers, 2 Buyers)
  const kebumenUsers = [
    { name: 'UD Tani Kebumen', role: 'PETANI', phone: '628138000001', comm: 'Gula Kelapa Asli Kebumen', price: 18000, qty: 500, lat: -7.6701, lng: 109.6524 },
    { name: 'Pak Karyo Petani', role: 'PETANI', phone: '628138000002', comm: 'Beras Premium Kebumen', price: 13800, qty: 800, lat: -7.6751, lng: 109.6584 },
    { name: 'Warung Makan Gombong', role: 'PEDAGANG', phone: '628138000003', comm: 'Beras Premium Kebumen', price: 13800, qty: 200, lat: -7.6651, lng: 109.6484 },
    { name: 'Toko Sembako Kebumen', role: 'PEDAGANG', phone: '628138000004', comm: 'Gula Kelapa Asli Kebumen', price: 18000, qty: 150, lat: -7.6781, lng: 109.6624 }
  ];

  for (const u of kebumenUsers) {
    const isSupplier = u.role === 'PETANI';
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phone },
      update: {
        name: u.name,
        businessName: u.name,
        address: `Kebumen, Jawa Tengah`,
        businessType: isSupplier ? 'Supplier Pangan Kebumen' : 'Pedagang Sembako Kebumen',
        role: u.role
      },
      create: {
        phoneNumber: u.phone,
        name: u.name,
        businessName: u.name,
        address: `Kebumen, Jawa Tengah`,
        businessType: isSupplier ? 'Supplier Pangan Kebumen' : 'Pedagang Sembako Kebumen',
        role: u.role,
        balance: isSupplier ? 1500000 : 0
      }
    });

    const entry = await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: isSupplier ? 'SUPPLY' : 'DEMAND',
        commodity: u.comm,
        qty: u.qty,
        price: u.price,
        location: 'Kebumen, Jawa Tengah',
        lat: u.lat,
        lng: u.lng,
        status: 'ACTIVE',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
      }
    });

    createdEntries.push({ entry, user, city: 'Kebumen' });
  }

  // ==========================================
  // 4. CREATE COMPARATIVE QRIS ORDERS
  // ==========================================
  // - Cilacap: 12 orders (TINGGI -> HIJAU)
  // - Banjarnegara: 2 orders (RENDAH -> MERAH)
  // - Kebumen: 2 orders (RENDAH -> MERAH)
  // - Tegal, Pemalang, Brebes: 0 orders (KOSONG -> ABU-ABU)

  const orderConfigs = [
    { city: 'Cilacap', targetCount: 12 },
    { city: 'Banjarnegara', targetCount: 2 },
    { city: 'Kebumen', targetCount: 2 }
  ];

  for (const config of orderConfigs) {
    const city = config.city;
    const citySuppliers = createdEntries.filter(e => e.city === city && e.entry.type === 'SUPPLY');
    const cityBuyers = createdEntries.filter(e => e.city === city && e.entry.type === 'DEMAND');

    const pairCount = Math.min(citySuppliers.length, cityBuyers.length, config.targetCount);
    for (let i = 0; i < pairCount; i++) {
      const supplyObj = citySuppliers[i];
      const demandObj = cityBuyers[i];

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

      const itemQty = 100 + i * 50;
      const pricePerKg = Number(supplyObj.entry.price);
      const shippingCost = 25000 + i * 5000;
      const totalAmount = itemQty * pricePerKg + shippingCost;

      const order = await prisma.order.create({
        data: {
          id: orderId,
          buyerUserId: demandObj.user.id,
          supplierName: supplyObj.user.businessName || supplyObj.user.name,
          supplierLocation: supplyObj.entry.location,
          courier: 'Logistik Tumbasna Direct',
          shippingCost: shippingCost,
          totalAmount: totalAmount,
          status: orderStatus,
          paymentQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${orderId}`,
          fundsReleased: orderStatus === 'SELESAI',
          buyerAddress: demandObj.user.address,
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

  console.log('✨ SEEDING COMPARATIVE DATA SELESAI DENGAN SUKSES! 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
