import { PrismaClient } from './tumbasna-dashboard/node_modules/@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌾 Memulai seeding data asli Purbalingga & Barlingmascakeb...');

  // 1. Bersihkan data transaksi lama (opsional/aman)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productEntry.deleteMany({});

  console.log('✅ Hapus data lama selesai.');

  // 2. Daftar Supplier & UMKM Asli Purbalingga & Sekitarnya
  const suppliersData = [
    {
      name: 'Gacorian.id',
      phone: '6285869236023',
      businessName: 'Gacorian.id (Kalimanah Purbalingga)',
      address: 'Jl. Raya Kalimanah, Kec. Kalimanah, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.4125,
      lng: 109.3385,
      products: [
        { commodity: 'beras pandan wangi', price: 15500, qty: 1500 },
        { commodity: 'beras premium ir64', price: 14200, qty: 2000 },
      ]
    },
    {
      name: 'Bu Sari',
      phone: '6281390124857',
      businessName: 'UD Sari Tani Purbalingga',
      address: 'Desa Karangbanjar, Kec. Bojongsari, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.3620,
      lng: 109.3580,
      products: [
        { commodity: 'cabai rawit merah', price: 42000, qty: 350 },
        { commodity: 'cabai merah keriting', price: 35000, qty: 500 },
      ]
    },
    {
      name: 'Pak Haryanto',
      phone: '6281903847201',
      businessName: 'Kelompok Tani Nanas Siwarak',
      address: 'Desa Siwarak, Kec. Karangreja, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.2950,
      lng: 109.3600,
      products: [
        { commodity: 'nanas madu karangreja', price: 8500, qty: 2500 },
      ]
    },
    {
      name: 'Pak Bambang',
      phone: '6285747391029',
      businessName: 'Koperasi Tani Duku & Durian Padamara',
      address: 'Kec. Padamara, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.3850,
      lng: 109.3120,
      products: [
        { commodity: 'duku padamara', price: 18000, qty: 800 },
        { commodity: 'durian lokal purbalingga', price: 45000, qty: 400 },
      ]
    },
    {
      name: 'Bulog Sub-Drivre Sokaraja',
      phone: '6281227849102',
      businessName: 'Gudang Bulog Sokaraja',
      address: 'Bulog Sokaraja, Desa Klahang, Kec. Sokaraja, Kabupaten Banyumas',
      lat: -7.4470,
      lng: 109.3134,
      products: [
        { commodity: 'beras medium sphp', price: 12500, qty: 5000 },
        { commodity: 'gula pasir maniskita', price: 16500, qty: 3000 },
      ]
    },
    {
      name: 'Kelompok Tani Dieng',
      phone: '6285291038472',
      businessName: 'Koperasi Kopi Batur Dieng',
      address: 'Kec. Batur, Kabupaten Banjarnegara, Jawa Tengah',
      lat: -7.2075,
      lng: 109.8285,
      products: [
        { commodity: 'kopi arabika dieng', price: 95000, qty: 600 },
        { commodity: 'kentang dieng super', price: 17500, qty: 1200 },
      ]
    }
  ];

  const buyersData = [
    {
      name: 'Pasar Segamas Purbalingga',
      phone: '6285100000001',
      businessName: 'Pedagang Pasar Segamas Purbalingga',
      address: 'Pasar SegaMas, Planjan, Kalikabong, Kec. Purbalingga, Kabupaten Purbalingga',
      lat: -7.3999,
      lng: 109.3490,
    },
    {
      name: 'Pasar Bukateja Purbalingga',
      phone: '6285100000002',
      businessName: 'Koperasi Pasar Bukateja',
      address: 'Jl. Raya Bukateja, Kec. Bukateja, Kabupaten Purbalingga',
      lat: -7.4420,
      lng: 109.4280,
    },
    {
      name: 'Pasar Bobotsari Purbalingga',
      phone: '6285100000003',
      businessName: 'Paguyuban Pedagang Pasar Bobotsari',
      address: 'Jl. Raya Bobotsari, Kec. Bobotsari, Kabupaten Purbalingga',
      lat: -7.2480,
      lng: 109.3080,
    },
    {
      name: 'Pasar Wage Purwokerto',
      phone: '6285100000004',
      businessName: 'Toko Kelontong Berkah Wage',
      address: 'Pasar Wage, Mangunjaya, Purwokerto Timur, Kabupaten Banyumas',
      lat: -7.4266,
      lng: 109.2492,
    },
    {
      name: 'Sentra Getuk Goreng H. Tohirin',
      phone: '6285100000005',
      businessName: 'Getuk Goreng H. Tohirin Sokaraja',
      address: 'Jl. Jend. Soedirman No. 16, Sokaraja Tengah, Kabupaten Banyumas',
      lat: -7.4589,
      lng: 109.2965,
    }
  ];

  // 3. Upsert Users & Product Entries
  console.log('👤 Membuat data Pengguna & Produk Purbalingga...');
  const createdSuppliers = [];
  const createdProducts = [];

  for (const s of suppliersData) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: s.phone },
      update: {
        name: s.name,
        businessName: s.businessName,
        address: s.address,
        businessType: 'PETANI',
        role: 'PETANI',
      },
      create: {
        phoneNumber: s.phone,
        name: s.name,
        businessName: s.businessName,
        address: s.address,
        businessType: 'PETANI',
        role: 'PETANI',
      }
    });
    createdSuppliers.push({ user, data: s });

    for (const p of s.products) {
      const prod = await prisma.productEntry.create({
        data: {
          userId: user.id,
          type: 'SUPPLY',
          commodity: p.commodity,
          price: p.price,
          qty: p.qty,
          location: s.address,
          lat: s.lat + (Math.random() - 0.5) * 0.005,
          lng: s.lng + (Math.random() - 0.5) * 0.005,
          status: 'ACTIVE'
        }
      });
      createdProducts.push({ prod, supplierUser: user, supplierData: s });
    }
  }

  const createdBuyers = [];
  for (const b of buyersData) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: b.phone },
      update: {
        name: b.name,
        businessName: b.businessName,
        address: b.address,
        businessType: 'PEDAGANG',
        role: 'PEDAGANG',
      },
      create: {
        phoneNumber: b.phone,
        name: b.name,
        businessName: b.businessName,
        address: b.address,
        businessType: 'PEDAGANG',
        role: 'PEDAGANG',
      }
    });
    createdBuyers.push({ user, data: b });
  }

  // 4. Seed Orders (Rute Logistik Purbalingga Real-Time)
  console.log('🚚 Membuat data Pesanan / Rute Logistik Purbalingga...');

  const mockOrders = [
    {
      id: 'ORD-PBG-001',
      supplierIndex: 0, // Gacorian.id Kalimanah Purbalingga
      buyerIndex: 3,    // Pasar Wage Purwokerto
      productIndex: 0,  // Beras Pandan Wangi
      qty: 500,
      status: 'DIKIRIM',
      courier: 'Budi Santoso (R 1234 AB)',
      shippingCost: 28500,
      notes: JSON.stringify({
        waybillNumber: 'TMB-PBG-9021',
        waybillCourier: 'Kurir TumbasNa Purbalingga',
        supplierAddress: 'Kalimanah, Purbalingga',
        buyerAddress: 'Pasar Wage, Purwokerto',
        supplierCoords: [-7.4125, 109.3385],
        buyerCoords: [-7.4266, 109.2492],
      })
    },
    {
      id: 'ORD-PBG-002',
      supplierIndex: 1, // UD Sari Tani Bojongsari Purbalingga
      buyerIndex: 0,    // Pasar Segamas Purbalingga
      productIndex: 2,  // Cabai Rawit Merah
      qty: 150,
      status: 'DIKIRIM',
      courier: 'Slamet Subagyo (R 4821 AA)',
      shippingCost: 17500,
      notes: JSON.stringify({
        waybillNumber: 'TMB-PBG-9022',
        waybillCourier: 'Kurir TumbasNa Purbalingga',
        supplierAddress: 'Bojongsari, Purbalingga',
        buyerAddress: 'Pasar Segamas, Purbalingga',
        supplierCoords: [-7.3620, 109.3580],
        buyerCoords: [-7.3999, 109.3490],
      })
    },
    {
      id: 'ORD-PBG-003',
      supplierIndex: 2, // Kelompok Tani Nanas Siwarak Karangreja Purbalingga
      buyerIndex: 1,    // Pasar Bukateja Purbalingga
      productIndex: 4,  // Nanas Madu
      qty: 1200,
      status: 'SELESAI',
      courier: 'Agus Prasetyo (R 5678 CD)',
      shippingCost: 42000,
      notes: JSON.stringify({
        waybillNumber: 'TMB-PBG-9023',
        waybillCourier: 'Kurir TumbasNa Purbalingga',
        supplierAddress: 'Karangreja, Purbalingga',
        buyerAddress: 'Bukateja, Purbalingga',
        supplierCoords: [-7.2950, 109.3600],
        buyerCoords: [-7.4420, 109.4280],
      })
    },
    {
      id: 'ORD-PBG-004',
      supplierIndex: 3, // Koperasi Duku Padamara Purbalingga
      buyerIndex: 2,    // Pasar Bobotsari Purbalingga
      productIndex: 5,  // Duku Padamara
      qty: 400,
      status: 'DIPROSES',
      courier: 'Hendra Wijaya (R 3456 GH)',
      shippingCost: 31000,
      notes: JSON.stringify({
        supplierAddress: 'Padamara, Purbalingga',
        buyerAddress: 'Bobotsari, Purbalingga',
        supplierCoords: [-7.3850, 109.3120],
        buyerCoords: [-7.2480, 109.3080],
      })
    },
    {
      id: 'ORD-PBG-005',
      supplierIndex: 4, // Gudang Bulog Sokaraja
      buyerIndex: 0,    // Pasar Segamas Purbalingga
      productIndex: 7,  // Gula Pasir
      qty: 2000,
      status: 'DIBATALKAN',
      courier: 'Slamet Riyadi (R 7890 IJ)',
      shippingCost: 35000,
      notes: JSON.stringify({
        supplierAddress: 'Sokaraja, Banyumas',
        buyerAddress: 'Pasar Segamas, Purbalingga',
        supplierCoords: [-7.4470, 109.3134],
        buyerCoords: [-7.3999, 109.3490],
      })
    }
  ];

  for (const o of mockOrders) {
    const supp = createdSuppliers[o.supplierIndex];
    const buy  = createdBuyers[o.buyerIndex];
    const prod = createdProducts[o.productIndex];

    const totalAmt = Number(prod.prod.price) * o.qty + o.shippingCost;

    await prisma.order.create({
      data: {
        id: o.id,
        buyerUserId: buy.user.id,
        supplierName: supp.data.businessName,
        supplierLocation: supp.data.address,
        courier: o.courier,
        shippingCost: o.shippingCost,
        totalAmount: totalAmt,
        status: o.status as any,
        fundsReleased: o.status === 'SELESAI',
        notes: o.notes,
        items: {
          create: [
            {
              productEntryId: prod.prod.id,
              commodity: prod.prod.commodity,
              price: prod.prod.price,
              qty: o.qty,
              supplierName: supp.data.businessName,
            }
          ]
        }
      }
    });
  }

  console.log('🎉 Seeding data asli Purbalingga & Barlingmascakeb sukses!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
