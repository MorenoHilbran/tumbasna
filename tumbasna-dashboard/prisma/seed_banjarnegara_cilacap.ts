import { PrismaClient, user_role, entry_type, entry_status, match_status, order_status } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to parse simple CSV line handling quoted strings
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
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

// Clean text helper
function cleanQuotes(str: string): string {
  if (!str) return '';
  return str.replace(/^"+|"+$/g, '').trim();
}

async function main() {
  console.log('🌾 Memulai seeding data UMKM Banjarnegara & Cilacap dari folder docs...');

  const docsDir = path.join(__dirname, '..', '..', 'docs');
  const banjarnegaraFile = path.join(docsDir, 'DATA UMKM - Banjarnegara.csv');
  const cilacapFile = path.join(docsDir, 'DATA UMKM SUPPLIER BUYYER CILACAP.csv');

  if (!fs.existsSync(banjarnegaraFile) || !fs.existsSync(cilacapFile)) {
    console.error('❌ CSV files not found in docs folder!');
    process.exit(1);
  }

  // Read Banjarnegara CSV
  const banjarRaw = fs.readFileSync(banjarnegaraFile, 'utf-8');
  const banjarLines = banjarRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Read Cilacap CSV
  const cilacapRaw = fs.readFileSync(cilacapFile, 'utf-8');
  const cilacapLines = cilacapRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`📊 Total baris Banjarnegara: ${banjarLines.length}, Cilacap: ${cilacapLines.length}`);

  // List commodity options for Banjarnegara
  const banjarCommodityList = [
    { name: 'Beras Pandan Wangi Super', price: 16000, baseQty: 1500, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80' },
    { name: 'Beras IR64 Premium', price: 13500, baseQty: 2500, img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=500&q=80' },
    { name: 'Beras Mentik Susu Wangi', price: 17500, baseQty: 1000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80' },
    { name: 'Beras Merah Sehat Oji', price: 21000, baseQty: 800, img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=500&q=80' },
    { name: 'Salak Pondoh Dieng', price: 11000, baseQty: 1200, img: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&q=80' },
    { name: 'Kopi Arabika Dieng', price: 95000, baseQty: 500, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80' },
    { name: 'Kentang Super Dieng', price: 14500, baseQty: 3000, img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80' },
    { name: 'Bekatul Super Gilingan', price: 4500, baseQty: 5000, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80' }
  ];

  // List commodity options for Cilacap
  const cilacapCommodityList = [
    { name: 'Ikan Layur Segar Tangkapan Nelayan', price: 38000, baseQty: 1200, img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80' },
    { name: 'Ikan Tenggiri Super Cilacap', price: 85000, baseQty: 900, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' },
    { name: 'Udang Windu Beku PT Toxindo', price: 95000, baseQty: 1500, img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80' },
    { name: 'Ikan Asin Sentolo Kawat Khas', price: 35000, baseQty: 800, img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80' },
    { name: 'Kerupuk Tenggiri Mr. Mackarel', price: 45000, baseQty: 600, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' },
    { name: 'Ikan Asap Gapitan Berkah', price: 32000, baseQty: 750, img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80' },
    { name: 'Ikan Tuna Segar Pelabuhan', price: 78000, baseQty: 1100, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' },
    { name: 'Kerang Ijo Saus Padang Fresh', price: 28000, baseQty: 1000, img: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500&q=80' },
    { name: 'Bandeng Super Fresh Cilacap', price: 34000, baseQty: 1300, img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&q=80' },
    { name: 'Bawal Hitam Laut Cilacap', price: 65000, baseQty: 850, img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80' }
  ];

  const createdUsers: any[] = [];
  const createdEntries: any[] = [];

  // ==========================================
  // 1. SEED BANJARNEGARA DATA
  // ==========================================
  console.log('📌 Processing Banjarnegara UMKM...');
  let bIdx = 0;
  for (const line of banjarLines) {
    bIdx++;
    const cols = parseCSVLine(line);
    if (cols.length < 4) continue;

    const rawName = cleanQuotes(cols[0]);
    const mapsUrl = cleanQuotes(cols[1]);
    const rawCoords = cleanQuotes(cols[2]);
    const rawRole = cleanQuotes(cols[3]).toUpperCase();

    let lat: number | null = null;
    let lng: number | null = null;
    if (rawCoords.includes(',')) {
      const parts = rawCoords.split(',');
      lat = parseFloat(parts[0].trim());
      lng = parseFloat(parts[1].trim());
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      // Default Banjarnegara town center fallback
      lat = -7.3884 + (Math.random() - 0.5) * 0.08;
      lng = 109.6939 + (Math.random() - 0.5) * 0.08;
    }

    const isSupplier = rawRole.includes('SUPPLIER');
    const role: user_role = isSupplier ? 'PETANI' : 'PEDAGANG';
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

    // Pick commodity item
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

  console.log(`✅ Banjarnegara users & entries seeded: ${createdUsers.length}`);

  // ==========================================
  // 2. SEED CILACAP DATA
  // ==========================================
  console.log('📌 Processing Cilacap UMKM...');
  let cIdx = 0;
  for (const line of cilacapLines) {
    // Skip empty or header
    if (!line || line.startsWith(',,,')) continue;

    cIdx++;
    const cols = parseCSVLine(line);
    if (cols.length < 5) continue;

    const rawName = cleanQuotes(cols[0]);
    const mapsUrl = cleanQuotes(cols[1]);
    const description = cleanQuotes(cols[2]);
    const rawCoords = cleanQuotes(cols[3]);
    const rawAddress = cleanQuotes(cols[4]);
    const rawRole = cols[5] ? cleanQuotes(cols[5]).toUpperCase() : 'SUPPLIER';

    if (!rawName || rawName.length < 2) continue;

    let lat: number | null = null;
    let lng: number | null = null;
    if (rawCoords.includes(',')) {
      const parts = rawCoords.split(',');
      lat = parseFloat(parts[0].trim());
      lng = parseFloat(parts[1].trim());
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      // Default Cilacap coastal fallback
      lat = -7.7150 + (Math.random() - 0.5) * 0.08;
      lng = 109.0150 + (Math.random() - 0.5) * 0.08;
    }

    const isSupplier = rawRole.includes('SUPPLIER');
    const role: user_role = isSupplier ? 'PETANI' : 'PEDAGANG';
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

    // Pick commodity item
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

  console.log(`✅ Total Users Seeded: ${createdUsers.length}, Total Entries Seeded: ${createdEntries.length}`);

  // ==========================================
  // 3. CREATE MATCHES & REAL ORDERS (ZONA QRIS)
  // ==========================================
  console.log('🤝 Creating Matches & QRIS Orders for Banjarnegara & Cilacap...');

  const cities = ['Banjarnegara', 'Cilacap'];

  for (const city of cities) {
    const citySuppliers = createdEntries.filter(e => e.city === city && e.entry.type === 'SUPPLY');
    const cityBuyers = createdEntries.filter(e => e.city === city && e.entry.type === 'DEMAND');

    console.log(`📍 ${city}: ${citySuppliers.length} Suppliers, ${cityBuyers.length} Buyers`);

    const pairCount = Math.min(citySuppliers.length, cityBuyers.length, 12);
    for (let i = 0; i < pairCount; i++) {
      const supplyObj = citySuppliers[i];
      const demandObj = cityBuyers[i];

      // Create Match
      const matchCode = `MATCH-${city.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${i + 1}`;
      const match = await prisma.match.create({
        data: {
          code: matchCode,
          supplyEntryId: supplyObj.entry.id,
          demandEntryId: demandObj.entry.id,
          status: 'MATCHED'
        }
      });

      // Create Orders with various statuses: DIPROSES, DIKIRIM, SELESAI
      const statuses: order_status[] = ['DIPROSES', 'DIKIRIM', 'SELESAI'];
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
          courier: i % 2 === 0 ? 'Logistik Tumbasna Direct' : 'Kargo Mitra Barlingmascakeb',
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

      // OrderItem
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

      // Payment record
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

  console.log('✨ SEEDING DATA UMKM BANJARNEGARA & CILACAP SELESAI DENGAN SUKSES! 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
