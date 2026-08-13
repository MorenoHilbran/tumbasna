import { PrismaClient } from './tumbasna-dashboard/node_modules/@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌾 Memulai seeding 100 usaha/lokasi Purbalingga Kluster 2...');

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productEntry.deleteMany({});

  const suppliersData = [
    {
      name: 'Dapoer_Dhinza',
      phone: '6285100001',
      businessName: 'Dapoer_Dhinza',
      address: 'H98G+3XG, Dusun I, Jetis, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4344336,
      lng: 109.37591,
      category: 'UMKM/Kuliner',
      district: 'Kemangkon',
      village: 'Jetis',
      products: [
        { commodity: 'Dapoer_Dhinza', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan RBS',
      phone: '6285100002',
      businessName: 'Warung Makan RBS',
      address: 'G9WP+F5G, Karangkemiri, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4542773,
      lng: 109.38731,
      category: 'Kuliner',
      district: 'Kemangkon',
      village: 'Karangkemiri',
      products: [
        { commodity: 'Warung Makan RBS', price: 0, qty: 0 }
      ]
    },
    {
      name: 'KEDAI AZKA KEDUNG LEGOK KEMANGKON',
      phone: '6285100003',
      businessName: 'KEDAI AZKA KEDUNG LEGOK KEMANGKON',
      address: 'G9QX+VCJ, Unnamed Road, Area Sawah, Kedunglegok, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4603711,
      lng: 109.39885,
      category: 'Kuliner',
      district: 'Kemangkon',
      village: 'Kedunglegok',
      products: [
        { commodity: 'KEDAI AZKA KEDUNG LEGOK KEMANGKON', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Makanan ringan',
      phone: '6285100004',
      businessName: 'Makanan ringan',
      address: 'G9HV+FP4, Kedunglegok Dua, Kedunglegok, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.471543,
      lng: 109.39495,
      category: 'UMKM/Kuliner',
      district: 'Kemangkon',
      village: 'Kedunglegok',
      products: [
        { commodity: 'Makanan ringan', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Asyifa cake & cookies',
      phone: '6285100005',
      businessName: 'Asyifa cake & cookies',
      address: 'GCP6+V5P, RT.01/RW.03, Kedungtuk, Kemangkon, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.4630273,
      lng: 109.41139,
      category: 'UMKM/Kuliner',
      district: 'Kemangkon',
      village: 'Kedungtuk',
      products: [
        { commodity: 'Asyifa cake & cookies', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Amal',
      phone: '6285100006',
      businessName: 'Toko Amal',
      address: 'GCV3+CRJ, Kemangkon, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4563086,
      lng: 109.40415,
      category: 'Toko/Supplier',
      district: 'Kemangkon',
      village: 'Kemangkon',
      products: [
        { commodity: 'Toko Amal', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Agus cell & sembako',
      phone: '6285100007',
      businessName: 'Agus cell & sembako',
      address: 'GCH7+WR3, Kemujing, Kemangkon, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4701367,
      lng: 109.41413,
      category: 'Toko/Supplier',
      district: 'Kemangkon',
      village: 'Kemujing',
      products: [
        { commodity: 'Agus cell & sembako', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Purbalingga Kemangkon majasem',
      phone: '6285100008',
      businessName: 'Purbalingga Kemangkon majasem',
      address: 'H97W+C5R, Dusun II, Majasem, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4367383,
      lng: 109.39683,
      category: 'Kuliner',
      district: 'Kemangkon',
      village: 'Majasem',
      products: [
        { commodity: 'Purbalingga Kemangkon majasem', price: 0, qty: 0 }
      ]
    },
    {
      name: 'WARUNG ZIDAN',
      phone: '6285100009',
      businessName: 'WARUNG ZIDAN',
      address: 'H97V+GQ9, Dusun II, Majasem, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4357227,
      lng: 109.39255,
      category: 'Toko/Supplier',
      district: 'Kemangkon',
      village: 'Majasem',
      products: [
        { commodity: 'WARUNG ZIDAN', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Gorengan Bu Engkar UMKM UMP',
      phone: '6285100010',
      businessName: 'Warung Gorengan Bu Engkar UMKM UMP',
      address: 'H95V+46F, Jl. Raya Panican Utara, Dusun I, Panican, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4424414,
      lng: 109.39399,
      category: 'UMKM/Kuliner',
      district: 'Kemangkon',
      village: 'Panican',
      products: [
        { commodity: 'Warung Gorengan Bu Engkar UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Sate-Tongseng Kambing dan Ayam Huh-Hah',
      phone: '6285100011',
      businessName: 'Warung Sate-Tongseng Kambing dan Ayam Huh-Hah',
      address: 'H92W+4R7, Dusun IV, Panican, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4494727,
      lng: 109.39611,
      category: 'UMKM/Kuliner',
      district: 'Kemangkon',
      village: 'Panican',
      products: [
        { commodity: 'Warung Sate-Tongseng Kambing dan Ayam Huh-Hah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'SEBLAK MAMA KEVIN UMKM UMP',
      phone: '6285100012',
      businessName: 'SEBLAK MAMA KEVIN UMKM UMP',
      address: 'G989+Q3R, Jl. Raya Pelumutan, Pelumutan, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4829883,
      lng: 109.36763,
      category: 'UMKM/Kuliner',
      district: 'Kemangkon',
      village: 'Pelumutan',
      products: [
        { commodity: 'SEBLAK MAMA KEVIN UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko CAKRA',
      phone: '6285100013',
      businessName: 'Toko CAKRA',
      address: 'G999+9QX, Pelumutan, Plumutan, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.4812695,
      lng: 109.36859,
      category: 'Toko/Supplier',
      district: 'Kemangkon',
      village: 'Pelumutan',
      products: [
        { commodity: 'Toko CAKRA', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung sembako damar',
      phone: '6285100014',
      businessName: 'Warung sembako damar',
      address: 'G9M8+JVM, Kedungori, Senon, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.4656836,
      lng: 109.36627,
      category: 'Toko/Supplier',
      district: 'Kemangkon',
      village: 'Senon',
      products: [
        { commodity: 'Warung sembako damar', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Kelontong Kasiah',
      phone: '6285100015',
      businessName: 'Toko Kelontong Kasiah',
      address: 'G9GM+P35, Srengseng, Majatengah, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4737305,
      lng: 109.38467,
      category: 'Toko/Supplier',
      district: 'Kemangkon',
      village: 'Srengseng/Majatengah',
      products: [
        { commodity: 'Toko Kelontong Kasiah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'WARUNG MAKAN RR',
      phone: '6285100016',
      businessName: 'WARUNG MAKAN RR',
      address: 'H9H8+MWR, Dusun IV, Toyareka, Kec. Kemangkon, Kabupaten Purbalingga, Jawa Tengah 53381',
      lat: -7.4206445,
      lng: 109.36683,
      category: 'Kuliner',
      district: 'Kemangkon',
      village: 'Toyareka',
      products: [
        { commodity: 'WARUNG MAKAN RR', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Bukateja Bakery',
      phone: '6285100017',
      businessName: 'Bukateja Bakery',
      address: 'HCCM+GC9, Dusun 3, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4285352,
      lng: 109.43285,
      category: 'UMKM/Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'Bukateja Bakery', price: 0, qty: 0 }
      ]
    },
    {
      name: 'KEDAI Senja',
      phone: '6285100018',
      businessName: 'KEDAI Senja',
      address: 'HCCG+RQ2, Jl. Purbalingga - Klampok, Dusun 4, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4276367,
      lng: 109.42551,
      category: 'Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'KEDAI Senja', price: 0, qty: 0 }
      ]
    },
    {
      name: 'PAMER Pancong Lumer UMKM UMP',
      phone: '6285100019',
      businessName: 'PAMER Pancong Lumer UMKM UMP',
      address: 'HCCH+P8V, Jl. Purwandaru, RT.05/RW.02, Dusun 1, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.428457,
      lng: 109.42965,
      category: 'UMKM/Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'PAMER Pancong Lumer UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Roti',
      phone: '6285100020',
      businessName: 'Toko Roti',
      address: 'HCCJ+G87, Jl. Purbalingga - Banjarnegara, Dusun 4, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4285352,
      lng: 109.43011,
      category: 'UMKM/Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'Toko Roti', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan MBA GAPRI',
      phone: '6285100021',
      businessName: 'Warung Makan MBA GAPRI',
      address: 'Dusun 3, Jl. Bukateja, RT.03/RW.03, Dusun 3, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4264648,
      lng: 109.42097,
      category: 'Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'Warung Makan MBA GAPRI', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Pojok',
      phone: '6285100022',
      businessName: 'Warung Makan Pojok',
      address: 'HCFC+8PM, Jl. Purbalingga - Klampok, Dusun 5, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4264648,
      lng: 109.42097,
      category: 'Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'Warung Makan Pojok', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Pojok',
      phone: '6285100023',
      businessName: 'Warung Pojok',
      address: 'HCFC+8PM, Jl. Purbalingga - Klampok, Dusun 5, Bukateja, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4264648,
      lng: 109.42097,
      category: 'Kuliner',
      district: 'Bukateja',
      village: 'Bukateja',
      products: [
        { commodity: 'Warung Pojok', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Aneka Gorengan UMKM UMP',
      phone: '6285100024',
      businessName: 'Aneka Gorengan UMKM UMP',
      address: 'HF35+7MM, Dusun 2, Cipawon, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4464648,
      lng: 109.45787,
      category: 'UMKM/Kuliner',
      district: 'Bukateja',
      village: 'Cipawon',
      products: [
        { commodity: 'Aneka Gorengan UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Sembako Ibu Bariyah',
      phone: '6285100025',
      businessName: 'Warung Sembako Ibu Bariyah',
      address: 'GCWH+7GX, Jl. Lanud Wirasaba, Dusun II, Kembangan, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4539258,
      lng: 109.42759,
      category: 'Toko/Supplier',
      district: 'Bukateja',
      village: 'Kembangan',
      products: [
        { commodity: 'Warung Sembako Ibu Bariyah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Sembako Khusnul',
      phone: '6285100026',
      businessName: 'Toko Sembako Khusnul',
      address: 'HFCW+37R, Dusun 3, Kutawis, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.429707,
      lng: 109.49553,
      category: 'Toko/Supplier',
      district: 'Bukateja',
      village: 'Kutawis',
      products: [
        { commodity: 'Toko Sembako Khusnul', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Wujud Berkah',
      phone: '6285100027',
      businessName: 'Warung Makan Wujud Berkah',
      address: 'HFCP+M4P, Jl. Bukateja, Dusun 2, Kutawis, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4286523,
      lng: 109.48679,
      category: 'Kuliner',
      district: 'Bukateja',
      village: 'Kutawis',
      products: [
        { commodity: 'Warung Makan Wujud Berkah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Kelontong Pak Yono',
      phone: '6285100028',
      businessName: 'Toko Kelontong Pak Yono',
      address: 'HC4J+3G6, Jl. DPU, Dusun 2, Majasari, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.444668,
      lng: 109.43059,
      category: 'Toko/Supplier',
      district: 'Bukateja',
      village: 'Majasari',
      products: [
        { commodity: 'Toko Kelontong Pak Yono', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung makan',
      phone: '6285100029',
      businessName: 'Warung makan',
      address: 'HC36+3VR, Jl. Raya Tidu, Dusun 1, Tidu, Kec. Bukateja, Kabupaten Purbalingga, Jawa Tengah 53382',
      lat: -7.4468945,
      lng: 109.41073,
      category: 'Kuliner',
      district: 'Bukateja',
      village: 'Tidu',
      products: [
        { commodity: 'Warung makan', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Keluarga Kita Kaligondang',
      phone: '6285100030',
      businessName: 'Kedai Keluarga Kita Kaligondang',
      address: 'None',
      lat: -7.3784961,
      lng: 109.40387,
      category: 'Kuliner',
      district: 'Kaligondang',
      village: 'Kaligondang',
      products: [
        { commodity: 'Kedai Keluarga Kita Kaligondang', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai kopi',
      phone: '6285100031',
      businessName: 'Kedai kopi',
      address: 'None',
      lat: -7.3783008,
      lng: 109.40083,
      category: 'Kuliner',
      district: 'Kaligondang',
      village: 'Kaligondang',
      products: [
        { commodity: 'Kedai kopi', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Pasar Kaligondang',
      phone: '6285100032',
      businessName: 'Pasar Kaligondang',
      address: 'None',
      lat: -7.3783398,
      lng: 109.40859,
      category: 'Pasar/Supplier',
      district: 'Kaligondang',
      village: 'Kaligondang',
      products: [
        { commodity: 'Pasar Kaligondang', price: 0, qty: 0 }
      ]
    },
    {
      name: 'PUKIS BAKERY',
      phone: '6285100033',
      businessName: 'PUKIS BAKERY',
      address: 'None',
      lat: -7.3789258,
      lng: 109.40553,
      category: 'UMKM/Kuliner',
      district: 'Kaligondang',
      village: 'Kaligondang',
      products: [
        { commodity: 'PUKIS BAKERY', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko purbalingga',
      phone: '6285100034',
      businessName: 'Toko purbalingga',
      address: 'None',
      lat: -7.3787305,
      lng: 109.40001,
      category: 'Toko/Supplier',
      district: 'Kaligondang',
      village: 'Kaligondang',
      products: [
        { commodity: 'Toko purbalingga', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Rahmat',
      phone: '6285100035',
      businessName: 'Toko Rahmat',
      address: 'None',
      lat: -7.3817383,
      lng: 109.41107,
      category: 'Toko/Supplier',
      district: 'Kaligondang',
      village: 'Kaligondang',
      products: [
        { commodity: 'Toko Rahmat', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Khasanah',
      phone: '6285100036',
      businessName: 'Kedai Khasanah',
      address: 'None',
      lat: -7.370293,
      lng: 109.37721,
      category: 'Kuliner',
      district: 'Kaligondang',
      village: 'Kalikajar',
      products: [
        { commodity: 'Kedai Khasanah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Soto',
      phone: '6285100037',
      businessName: 'Warung Soto',
      address: 'None',
      lat: -7.3792383,
      lng: 109.38733,
      category: 'UMKM/Kuliner',
      district: 'Kaligondang',
      village: 'Kalikajar',
      products: [
        { commodity: 'Warung Soto', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Navissa',
      phone: '6285100038',
      businessName: 'Toko Navissa',
      address: 'None',
      lat: -7.3972461,
      lng: 109.42315,
      category: 'Toko/Supplier',
      district: 'Kaligondang',
      village: 'Penolih',
      products: [
        { commodity: 'Toko Navissa', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Usaha Jaya',
      phone: '6285100039',
      businessName: 'Usaha Jaya',
      address: 'None',
      lat: -7.3942383,
      lng: 109.43059,
      category: 'Toko/Supplier',
      district: 'Kaligondang',
      village: 'Penolih',
      products: [
        { commodity: 'Usaha Jaya', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan SEDERHANA',
      phone: '6285100040',
      businessName: 'Warung Makan SEDERHANA',
      address: 'None',
      lat: -7.3830273,
      lng: 109.43171,
      category: 'Kuliner',
      district: 'Kaligondang',
      village: 'Selakambang',
      products: [
        { commodity: 'Warung Makan SEDERHANA', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Haisha Cake',
      phone: '6285100041',
      businessName: 'Haisha Cake',
      address: 'None',
      lat: -7.3846289,
      lng: 109.43553,
      category: 'UMKM/Kuliner',
      district: 'Kaligondang',
      village: 'Sinduraja',
      products: [
        { commodity: 'Haisha Cake', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Sembako Faishal',
      phone: '6285100042',
      businessName: 'Toko Sembako Faishal',
      address: 'None',
      lat: -7.3843164,
      lng: 109.44497,
      category: 'Toko/Supplier',
      district: 'Kaligondang',
      village: 'Sinduraja',
      products: [
        { commodity: 'Toko Sembako Faishal', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Mak Wati',
      phone: '6285100043',
      businessName: 'Warung Makan Mak Wati',
      address: 'None',
      lat: -7.389082,
      lng: 109.44395,
      category: 'Kuliner',
      district: 'Kaligondang',
      village: 'Sinduraja',
      products: [
        { commodity: 'Warung Makan Mak Wati', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Ridho',
      phone: '6285100044',
      businessName: 'Warung Makan Ridho',
      address: 'None',
      lat: -7.384043,
      lng: 109.44167,
      category: 'Kuliner',
      district: 'Kaligondang',
      village: 'Sinduraja',
      products: [
        { commodity: 'Warung Makan Ridho', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Ice Cappucino Cincau Bandez UMKM UMP',
      phone: '6285100045',
      businessName: 'Ice Cappucino Cincau Bandez UMKM UMP',
      address: 'None',
      lat: -7.4027539,
      lng: 109.43383,
      category: 'UMKM/Kuliner',
      district: 'Kejobong',
      village: 'Bandingan',
      products: [
        { commodity: 'Ice Cappucino Cincau Bandez UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Mie Gacoan',
      phone: '6285100046',
      businessName: 'Kedai Mie Gacoan',
      address: 'None',
      lat: -7.4020508,
      lng: 109.43363,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Bandingan',
      products: [
        { commodity: 'Kedai Mie Gacoan', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Seblak ceker UMKM UMP',
      phone: '6285100047',
      businessName: 'Seblak ceker UMKM UMP',
      address: 'None',
      lat: -7.4035352,
      lng: 109.43727,
      category: 'UMKM/Kuliner',
      district: 'Kejobong',
      village: 'Bandingan',
      products: [
        { commodity: 'Seblak ceker UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung sembako pak tugiyo',
      phone: '6285100048',
      businessName: 'Warung sembako pak tugiyo',
      address: 'None',
      lat: -7.4049023,
      lng: 109.43399,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Bandingan',
      products: [
        { commodity: 'Warung sembako pak tugiyo', price: 0, qty: 0 }
      ]
    },
    {
      name: 'tehdesakejobong',
      phone: '6285100049',
      businessName: 'tehdesakejobong',
      address: 'None',
      lat: -7.3906445,
      lng: 109.50883,
      category: 'UMKM/Kuliner',
      district: 'Kejobong',
      village: 'Cilalung',
      products: [
        { commodity: 'tehdesakejobong', price: 0, qty: 0 }
      ]
    },
    {
      name: 'warung makan ayam bakar Bang Jay',
      phone: '6285100050',
      businessName: 'warung makan ayam bakar Bang Jay',
      address: 'None',
      lat: -7.3909961,
      lng: 109.51111,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Cilalung',
      products: [
        { commodity: 'warung makan ayam bakar Bang Jay', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Pasar Raya Kejobong',
      phone: '6285100051',
      businessName: 'Pasar Raya Kejobong',
      address: 'None',
      lat: -7.3891992,
      lng: 109.51049,
      category: 'Pasar/Supplier',
      district: 'Kejobong',
      village: 'Kalimcong',
      products: [
        { commodity: 'Pasar Raya Kejobong', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Murah Sembako',
      phone: '6285100052',
      businessName: 'Toko Murah Sembako',
      address: 'None',
      lat: -7.389043,
      lng: 109.51079,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Kalimcong',
      products: [
        { commodity: 'Toko Murah Sembako', price: 0, qty: 0 }
      ]
    },
    {
      name: 'TOKO NOVA',
      phone: '6285100053',
      businessName: 'TOKO NOVA',
      address: 'None',
      lat: -7.3891211,
      lng: 109.51225,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Kalimcong',
      products: [
        { commodity: 'TOKO NOVA', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Mba Rum',
      phone: '6285100054',
      businessName: 'Warung Makan Mba Rum',
      address: 'None',
      lat: -7.390957,
      lng: 109.51167,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Kalimcong',
      products: [
        { commodity: 'Warung Makan Mba Rum', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Pentol kuah dan kering UMKM UMP',
      phone: '6285100055',
      businessName: 'Pentol kuah dan kering UMKM UMP',
      address: 'None',
      lat: -7.390918,
      lng: 109.50885,
      category: 'UMKM/Kuliner',
      district: 'Kejobong',
      village: 'Karangpoh',
      products: [
        { commodity: 'Pentol kuah dan kering UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Azka Bakery',
      phone: '6285100056',
      businessName: 'Azka Bakery',
      address: 'None',
      lat: -7.392793,
      lng: 109.50167,
      category: 'UMKM/Kuliner',
      district: 'Kejobong',
      village: 'Kejobong',
      products: [
        { commodity: 'Azka Bakery', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Vanqin sembako',
      phone: '6285100057',
      businessName: 'Vanqin sembako',
      address: 'None',
      lat: -7.3891992,
      lng: 109.51211,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Kejobong',
      products: [
        { commodity: 'Vanqin sembako', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Pojok Bu Paryo',
      phone: '6285100058',
      businessName: 'Warung Makan Pojok Bu Paryo',
      address: 'None',
      lat: -7.3906055,
      lng: 109.51047,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Kejobong',
      products: [
        { commodity: 'Warung Makan Pojok Bu Paryo', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Eka donut\'s&cake',
      phone: '6285100059',
      businessName: 'Eka donut\'s&cake',
      address: 'None',
      lat: -7.4166992,
      lng: 109.46047,
      category: 'UMKM/Kuliner',
      district: 'Kejobong',
      village: 'Krenceng',
      products: [
        { commodity: 'Eka donut\'s&cake', price: 0, qty: 0 }
      ]
    },
    {
      name: 'KEDAI HZN',
      phone: '6285100060',
      businessName: 'KEDAI HZN',
      address: 'None',
      lat: -7.405293,
      lng: 109.46791,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Krenceng',
      products: [
        { commodity: 'KEDAI HZN', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko udi kejobong',
      phone: '6285100061',
      businessName: 'Toko udi kejobong',
      address: 'None',
      lat: -7.4012305,
      lng: 109.51767,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Langgar',
      products: [
        { commodity: 'Toko udi kejobong', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Kirana',
      phone: '6285100062',
      businessName: 'Warung Kirana',
      address: 'None',
      lat: -7.4023633,
      lng: 109.50771,
      category: 'Toko/UMKM',
      district: 'Kejobong',
      village: 'Langgar',
      products: [
        { commodity: 'Warung Kirana', price: 0, qty: 0 }
      ]
    },
    {
      name: 'WARUNG MAKAN MAMA AMEL',
      phone: '6285100063',
      businessName: 'WARUNG MAKAN MAMA AMEL',
      address: 'None',
      lat: -7.395332,
      lng: 109.52165,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Langgar',
      products: [
        { commodity: 'WARUNG MAKAN MAMA AMEL', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Delight bakmie',
      phone: '6285100064',
      businessName: 'Kedai Delight bakmie',
      address: 'None',
      lat: -7.4041211,
      lng: 109.48275,
      category: 'Kuliner',
      district: 'Kejobong',
      village: 'Nangkasawit',
      products: [
        { commodity: 'Kedai Delight bakmie', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung sembako ibuk suntiah',
      phone: '6285100065',
      businessName: 'Warung sembako ibuk suntiah',
      address: 'None',
      lat: -7.3811523,
      lng: 109.53157,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Nangkod',
      products: [
        { commodity: 'Warung sembako ibuk suntiah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Kelontong Alden',
      phone: '6285100066',
      businessName: 'Toko Kelontong Alden',
      address: 'None',
      lat: -7.3995898,
      lng: 109.43593,
      category: 'Toko/Supplier',
      district: 'Kejobong',
      village: 'Penolih',
      products: [
        { commodity: 'Toko Kelontong Alden', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Es mama fina',
      phone: '6285100067',
      businessName: 'Kedai Es mama fina',
      address: 'None',
      lat: -7.3583398,
      lng: 109.49429,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Bedagas',
      products: [
        { commodity: 'Kedai Es mama fina', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung kopi Sri rejeki',
      phone: '6285100068',
      businessName: 'Warung kopi Sri rejeki',
      address: 'JGQ5+XMW, Jl. Raya Pengadegan, Kecombron, Bedagas, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah 53393',
      lat: -7.3601758,
      lng: 109.50987,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Bedagas',
      products: [
        { commodity: 'Warung kopi Sri rejeki', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung makan Bayun',
      phone: '6285100069',
      businessName: 'Warung makan Bayun',
      address: 'None',
      lat: -7.3604883,
      lng: 109.51099,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Bedagas',
      products: [
        { commodity: 'Warung makan Bayun', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Bang odik',
      phone: '6285100070',
      businessName: 'Kedai Bang odik',
      address: 'None',
      lat: -7.3708789,
      lng: 109.46105,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Gemenggeng',
      products: [
        { commodity: 'Kedai Bang odik', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Mie Ayam Ngangeni',
      phone: '6285100071',
      businessName: 'Mie Ayam Ngangeni',
      address: 'JFM8+4W8, Jl. Raya Pengadegan, Gemenggeng, Pengadegan, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah 53393',
      lat: -7.3669727,
      lng: 109.46633,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Gemenggeng',
      products: [
        { commodity: 'Mie Ayam Ngangeni', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Pasar Minggu Pengadegan',
      phone: '6285100072',
      businessName: 'Pasar Minggu Pengadegan',
      address: 'None',
      lat: -7.3696289,
      lng: 109.46307,
      category: 'Pasar/Supplier',
      district: 'Pengadegan',
      village: 'Gemenggeng',
      products: [
        { commodity: 'Pasar Minggu Pengadegan', price: 0, qty: 0 }
      ]
    },
    {
      name: 'SensaMie Kedai Makanan dan Minuman',
      phone: '6285100073',
      businessName: 'SensaMie Kedai Makanan dan Minuman',
      address: 'None',
      lat: -7.3695508,
      lng: 109.46321,
      category: 'UMKM/Kuliner',
      district: 'Pengadegan',
      village: 'Gemenggeng',
      products: [
        { commodity: 'SensaMie Kedai Makanan dan Minuman', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Sembako Arif',
      phone: '6285100074',
      businessName: 'Toko Sembako Arif',
      address: 'None',
      lat: -7.3675195,
      lng: 109.46663,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Gemenggeng',
      products: [
        { commodity: 'Toko Sembako Arif', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Khansa',
      phone: '6285100075',
      businessName: 'Toko Khansa',
      address: 'None',
      lat: -7.3646289,
      lng: 109.48033,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Karang Tengah',
      products: [
        { commodity: 'Toko Khansa', price: 0, qty: 0 }
      ]
    },
    {
      name: 'TOKO SEMBAKO MULYO',
      phone: '6285100076',
      businessName: 'TOKO SEMBAKO MULYO',
      address: 'None',
      lat: -7.3710352,
      lng: 109.47801,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Karang Tengah',
      products: [
        { commodity: 'TOKO SEMBAKO MULYO', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Winda',
      phone: '6285100077',
      businessName: 'Toko Winda',
      address: 'None',
      lat: -7.3695117,
      lng: 109.47495,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Karang Tengah',
      products: [
        { commodity: 'Toko Winda', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Ingah',
      phone: '6285100078',
      businessName: 'Warung Ingah',
      address: 'JFJM+3C8, Karang Tengah, Pengadegan, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah 53393',
      lat: -7.3697852,
      lng: 109.48333,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Karang Tengah',
      products: [
        { commodity: 'Warung Ingah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Bakso Edi Pengadegan (puntuk Wates)',
      phone: '6285100079',
      businessName: 'Bakso Edi Pengadegan (puntuk Wates)',
      address: 'JC9X+P5G, Sinduraja, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah 53391',
      lat: -7.3811523,
      lng: 109.44981,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Sinduraja',
      products: [
        { commodity: 'Bakso Edi Pengadegan (puntuk Wates)', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Kelontong Mba Lia',
      phone: '6285100080',
      businessName: 'Warung Kelontong Mba Lia',
      address: 'None',
      lat: -7.3573242,
      lng: 109.46655,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Tegalpingen',
      products: [
        { commodity: 'Warung Kelontong Mba Lia', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung kopi Ibu Aminah',
      phone: '6285100081',
      businessName: 'Warung kopi Ibu Aminah',
      address: 'MF67+C58, Dusun III, Tegalpingen, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah 53393',
      lat: -7.3393164,
      lng: 109.46433,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Tegalpingen',
      products: [
        { commodity: 'Warung kopi Ibu Aminah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Makan Gaul Bakso dan Mie Ayam',
      phone: '6285100082',
      businessName: 'Warung Makan Gaul Bakso dan Mie Ayam',
      address: 'None',
      lat: -7.3441211,
      lng: 109.46605,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Tegalpingen',
      products: [
        { commodity: 'Warung Makan Gaul Bakso dan Mie Ayam', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung sembako Tarmiyati',
      phone: '6285100083',
      businessName: 'Warung sembako Tarmiyati',
      address: 'None',
      lat: -7.3574023,
      lng: 109.47271,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Tegalpingen',
      products: [
        { commodity: 'Warung sembako Tarmiyati', price: 0, qty: 0 }
      ]
    },
    {
      name: 'GROSIR OCHE & MUSANGKING',
      phone: '6285100084',
      businessName: 'GROSIR OCHE & MUSANGKING',
      address: 'JFW5+PFJ, Kubang Wanget, Tetel, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah',
      lat: -7.3534961,
      lng: 109.45995,
      category: 'Toko/Supplier',
      district: 'Pengadegan',
      village: 'Tetel',
      products: [
        { commodity: 'GROSIR OCHE & MUSANGKING', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Nasi Bakar "Mama Githa"',
      phone: '6285100085',
      businessName: 'Warung Nasi Bakar "Mama Githa"',
      address: 'JFVH+925, Sibete, Tumanggal, Kec. Pengadegan, Kabupaten Purbalingga, Jawa Tengah 53393',
      lat: -7.3568555,
      lng: 109.47857,
      category: 'Kuliner',
      district: 'Pengadegan',
      village: 'Tumanggal',
      products: [
        { commodity: 'Warung Nasi Bakar "Mama Githa"', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung alan',
      phone: '6285100086',
      businessName: 'Warung alan',
      address: 'None',
      lat: -7.3305664,
      lng: 109.51899,
      category: 'Toko/Supplier',
      district: 'Rembang',
      village: 'Bantarbarang',
      products: [
        { commodity: 'Warung alan', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung ibu siti',
      phone: '6285100087',
      businessName: 'Warung ibu siti',
      address: 'MG98+XMR, Dusun II, Bantarbarang, Kec. Rembang, Kabupaten Purbalingga, Jawa Tengah 53356',
      lat: -7.3301758,
      lng: 109.51733,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Bantarbarang',
      products: [
        { commodity: 'Warung ibu siti', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Mie ayam komarudin',
      phone: '6285100088',
      businessName: 'Mie ayam komarudin',
      address: 'MHQ8+WWP, Jl. Raya Losari Gunungwuled, Karangbawang, Kec. Rembang, Kabupaten Purbalingga, Jawa Tengah 53356',
      lat: -7.3100586,
      lng: 109.56689,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Karangbawang',
      products: [
        { commodity: 'Mie ayam komarudin', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Izzy Cake & Cookies',
      phone: '6285100089',
      businessName: 'Izzy Cake & Cookies',
      address: 'None',
      lat: -7.3020117,
      lng: 109.54837,
      category: 'UMKM/Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'Izzy Cake & Cookies', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kedai Milkshake Aba Fida',
      phone: '6285100090',
      businessName: 'Kedai Milkshake Aba Fida',
      address: 'None',
      lat: -7.3045508,
      lng: 109.51955,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'Kedai Milkshake Aba Fida', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Kopi Sayang',
      phone: '6285100091',
      businessName: 'Kopi Sayang',
      address: 'MGVC+62C, Jl. Raya Losari, Dusun II, Losari, Kec. Rembang, Kabupaten Purbalingga, Jawa Tengah 53356',
      lat: -7.3074414,
      lng: 109.52207,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'Kopi Sayang', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Martabak favorite manasikana',
      phone: '6285100092',
      businessName: 'Martabak favorite manasikana',
      address: 'None',
      lat: -7.3067383,
      lng: 109.52121,
      category: 'UMKM/Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'Martabak favorite manasikana', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Rumah tuharni molen',
      phone: '6285100093',
      businessName: 'Rumah tuharni molen',
      address: 'None',
      lat: -7.3068945,
      lng: 109.52523,
      category: 'UMKM/Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'Rumah tuharni molen', price: 0, qty: 0 }
      ]
    },
    {
      name: 'UMKM jajanan dan rice bowl',
      phone: '6285100094',
      businessName: 'UMKM jajanan dan rice bowl',
      address: 'None',
      lat: -7.3068164,
      lng: 109.52075,
      category: 'UMKM/Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'UMKM jajanan dan rice bowl', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Kopi Lampung',
      phone: '6285100095',
      businessName: 'Warung Kopi Lampung',
      address: 'MGR8+PH3, Jl. Raya Losari, Dusun II, Losari, Kec. Rembang, Kabupaten Purbalingga, Jawa Tengah 53356',
      lat: -7.308418,
      lng: 109.51713,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Losari',
      products: [
        { commodity: 'Warung Kopi Lampung', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Sonia grosir sembako',
      phone: '6285100096',
      businessName: 'Sonia grosir sembako',
      address: 'None',
      lat: -7.3108789,
      lng: 109.49317,
      category: 'Toko/Supplier',
      district: 'Rembang',
      village: 'Makam',
      products: [
        { commodity: 'Sonia grosir sembako', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Nasi Goreng Pemalang Lintas Malam 78 UMKM UMP',
      phone: '6285100097',
      businessName: 'Nasi Goreng Pemalang Lintas Malam 78 UMKM UMP',
      address: 'None',
      lat: -7.3043555,
      lng: 109.51967,
      category: 'UMKM/Kuliner',
      district: 'Rembang',
      village: 'Sumampir',
      products: [
        { commodity: 'Nasi Goreng Pemalang Lintas Malam 78 UMKM UMP', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Toko Sembako Waras',
      phone: '6285100098',
      businessName: 'Toko Sembako Waras',
      address: 'None',
      lat: -7.3020508,
      lng: 109.51291,
      category: 'Toko/Supplier',
      district: 'Rembang',
      village: 'Sumampir',
      products: [
        { commodity: 'Toko Sembako Waras', price: 0, qty: 0 }
      ]
    },
    {
      name: 'Warung Nasi Ibu Tinah',
      phone: '6285100099',
      businessName: 'Warung Nasi Ibu Tinah',
      address: 'MGW7+HGP, Dusun I, Sumampir, Kec. Rembang, Kabupaten Purbalingga, Jawa Tengah 53356',
      lat: -7.3033398,
      lng: 109.51309,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Sumampir',
      products: [
        { commodity: 'Warung Nasi Ibu Tinah', price: 0, qty: 0 }
      ]
    },
    {
      name: 'bakso buntel Rembang',
      phone: '6285100100',
      businessName: 'bakso buntel Rembang',
      address: 'PG5M+M6C, Tanalum, Kec. Rembang, Kabupaten Purbalingga, Jawa Tengah 53356',
      lat: -7.2911914,
      lng: 109.53447,
      category: 'Kuliner',
      district: 'Rembang',
      village: 'Tanalum',
      products: [
        { commodity: 'bakso buntel Rembang', price: 0, qty: 0 }
      ]
    },
  ];

  const createdSuppliers = [];
  const createdProducts = [];

  for (const s of suppliersData) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: s.phone },
      update: {
        name: s.name,
        businessName: s.businessName,
        address: s.address,
        businessType: 'PEDAGANG',
        role: 'PEDAGANG',
      },
      create: {
        phoneNumber: s.phone,
        name: s.name,
        businessName: s.businessName,
        address: s.address,
        businessType: 'PEDAGANG',
        role: 'PEDAGANG',
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
          lat: s.lat,
          lng: s.lng,
          status: 'ACTIVE'
        }
      });
      createdProducts.push({ prod, supplierUser: user, supplierData: s });
    }
  }

  console.log(`🎉 Berhasil membuat ${createdSuppliers.length} usaha dan ${createdProducts.length} product entry.`);
}

main().catch