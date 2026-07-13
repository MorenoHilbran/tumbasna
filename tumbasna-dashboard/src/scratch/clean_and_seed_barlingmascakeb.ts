import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Memulai pembersihan database...');

  // 1. Hapus data transaksi dan produk terlebih dahulu untuk menghindari constraint foreign key
  await prisma.match.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.notificationQueue.deleteMany({});
  await prisma.paymentGroup.deleteMany({});
  await prisma.productEntry.deleteMany({});

  console.log('✅ Semua data transaksi, match, order, dan product entries berhasil dibersihkan.');

  // 2. Definisikan Wilayah Barlingmascakeb
  const regions = [
    {
      id: 'banyumas',
      name: 'Banyumas',
      lat: -7.5151,
      lng: 109.2941,
      address: 'Kabupaten Banyumas, Jawa Tengah'
    },
    {
      id: 'purbalingga',
      name: 'Purbalingga',
      lat: -7.3884,
      lng: 109.3641,
      address: 'Kabupaten Purbalingga, Jawa Tengah'
    },
    {
      id: 'cilacap',
      name: 'Cilacap',
      lat: -7.7150,
      lng: 108.9767,
      address: 'Kabupaten Cilacap, Jawa Tengah'
    },
    {
      id: 'banjarnegara',
      name: 'Banjarnegara',
      lat: -7.3884,
      lng: 109.6939,
      address: 'Kabupaten Banjarnegara, Jawa Tengah'
    },
    {
      id: 'kebumen',
      name: 'Kebumen',
      lat: -7.6701,
      lng: 109.6524,
      address: 'Kabupaten Kebumen, Jawa Tengah'
    }
  ];

  // 3. Upsert Mock Users untuk masing-masing wilayah
  console.log('🌱 Membuat/memperbarui pengguna (Petani & Pedagang) khusus Barlingmascakeb...');

  const farmers = [];
  const merchants = [];

  // Kita buat 5 Petani (satu di setiap kabupaten)
  const farmerNames = ['Pak Sugeng', 'Pak Slamet', 'Bu Yati', 'Pak Bambang', 'Bu Sari'];
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const phone = `628100000000${i + 1}`;
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {
        name: farmerNames[i],
        address: `Desa Makmur RT 01/01, ${region.name}`,
        businessName: `Tani Makmur ${region.name}`,
        businessType: 'PETANI',
        role: 'PETANI',
        balance: 0
      },
      create: {
        phoneNumber: phone,
        name: farmerNames[i],
        address: `Desa Makmur RT 01/01, ${region.name}`,
        businessName: `Tani Makmur ${region.name}`,
        businessType: 'PETANI',
        role: 'PETANI',
        balance: 0
      }
    });
    farmers.push({ user, region });
  }

  // Kita buat 5 Pedagang (satu di setiap kabupaten)
  const merchantNames = ['CV Berkah Tani', 'UD Sumber Makmur', 'Pasar Rakyat Jaya', 'Koperasi Tani Maju', 'UD Rejeki Lancar'];
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const phone = `628500000000${i + 1}`;
    const user = await prisma.user.upsert({
      where: { phoneNumber: phone },
      update: {
        name: merchantNames[i],
        address: `Pasar Utama RT 02/03, ${region.name}`,
        businessName: merchantNames[i],
        businessType: 'PEDAGANG',
        role: 'PEDAGANG',
        balance: 1000000
      },
      create: {
        phoneNumber: phone,
        name: merchantNames[i],
        address: `Pasar Utama RT 02/03, ${region.name}`,
        businessName: merchantNames[i],
        businessType: 'PEDAGANG',
        role: 'PEDAGANG',
        balance: 1000000
      }
    });
    merchants.push({ user, region });
  }

  // 4. Seed Product Entries (SUPPLY) dari Petani di Barlingmascakeb
  console.log('🌾 Membuat data SUPPLY (produk petani) di Barlingmascakeb...');
  
  const suppliesData = [
    { commodity: 'beras premium', price: 14500, qty: 1000, farmerIndex: 0 }, // Banyumas
    { commodity: 'beras pandan wangi', price: 16000, qty: 800, farmerIndex: 0 }, // Banyumas
    { commodity: 'cabai merah keriting', price: 34000, qty: 150, farmerIndex: 1 }, // Purbalingga
    { commodity: 'cabai rawit merah', price: 42000, qty: 120, farmerIndex: 1 }, // Purbalingga
    { commodity: 'bawang merah super', price: 28000, qty: 400, farmerIndex: 2 }, // Cilacap
    { commodity: 'bawang putih kating', price: 36000, qty: 300, farmerIndex: 3 }, // Banjarnegara
    { commodity: 'kentang dieng', price: 18000, qty: 500, farmerIndex: 3 }, // Banjarnegara
    { commodity: 'jagung manis', price: 9000, qty: 600, farmerIndex: 4 }, // Kebumen
    { commodity: 'jahe gajah', price: 22000, qty: 250, farmerIndex: 0 }, // Banyumas
    { commodity: 'tomat buah', price: 12000, qty: 350, farmerIndex: 4 } // Kebumen
  ];

  for (const s of suppliesData) {
    const { user, region } = farmers[s.farmerIndex];
    // Tambahkan sedikit variasi koordinat agar tidak menumpuk di satu titik pusat
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.04;

    await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: 'SUPPLY',
        commodity: s.commodity,
        qty: s.qty,
        price: s.price,
        location: region.name + ', Jawa Tengah',
        lat: region.lat + latOffset,
        lng: region.lng + lngOffset,
        status: 'ACTIVE'
      }
    });
  }

  // 5. Seed Product Entries (DEMAND) dari Pedagang di Barlingmascakeb
  console.log('🛒 Membuat data DEMAND (permintaan pasar) di Barlingmascakeb...');
  
  const demandsData = [
    { commodity: 'beras premium', price: 14700, qty: 500, merchantIndex: 0 }, // Banyumas
    { commodity: 'cabai rawit merah', price: 43500, qty: 100, merchantIndex: 1 }, // Purbalingga
    { commodity: 'bawang merah super', price: 29000, qty: 200, merchantIndex: 2 }, // Cilacap
    { commodity: 'kentang dieng', price: 18500, qty: 300, merchantIndex: 3 }, // Banjarnegara
    { commodity: 'jagung manis', price: 9500, qty: 400, merchantIndex: 4 } // Kebumen
  ];

  for (const d of demandsData) {
    const { user, region } = merchants[d.merchantIndex];
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.04;

    await prisma.productEntry.create({
      data: {
        userId: user.id,
        type: 'DEMAND',
        commodity: d.commodity,
        qty: d.qty,
        price: d.price,
        location: 'Pasar ' + region.name + ', Jawa Tengah',
        lat: region.lat + latOffset,
        lng: region.lng + lngOffset,
        status: 'ACTIVE'
      }
    });
  }

  console.log('✨ Database berhasil dibersihkan dan di-seed khusus wilayah Barlingmascakeb!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
