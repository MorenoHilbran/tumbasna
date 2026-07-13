import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Hapus data transaksi dan produk terlebih dahulu untuk menghindari constraint foreign key
        await prisma.match.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.notificationQueue.deleteMany({});
        await prisma.paymentGroup.deleteMany({});
        await prisma.productEntry.deleteMany({});

        // 2. Definisikan Wilayah Barlingmascakeb
        const regions = [
            { id: 'banyumas', name: 'Banyumas', lat: -7.5151, lng: 109.2941 },
            { id: 'purbalingga', name: 'Purbalingga', lat: -7.3884, lng: 109.3641 },
            { id: 'cilacap', name: 'Cilacap', lat: -7.7150, lng: 108.9767 },
            { id: 'banjarnegara', name: 'Banjarnegara', lat: -7.3884, lng: 109.6939 },
            { id: 'kebumen', name: 'Kebumen', lat: -7.6701, lng: 109.6524 }
        ];

        // 3. Buat/perbarui pengguna (Petani & Pedagang)
        const farmers = [];
        const merchants = [];

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

        // 4. Seed Product Entries (SUPPLY)
        const suppliesData = [
            { commodity: 'beras premium', price: 14500, qty: 1000, farmerIndex: 0 },
            { commodity: 'beras pandan wangi', price: 16000, qty: 800, farmerIndex: 0 },
            { commodity: 'cabai merah keriting', price: 34000, qty: 150, farmerIndex: 1 },
            { commodity: 'cabai rawit merah', price: 42000, qty: 120, farmerIndex: 1 },
            { commodity: 'bawang merah super', price: 28000, qty: 400, farmerIndex: 2 },
            { commodity: 'bawang putih kating', price: 36000, qty: 300, farmerIndex: 3 },
            { commodity: 'kentang dieng', price: 18000, qty: 500, farmerIndex: 3 },
            { commodity: 'jagung manis', price: 9000, qty: 600, farmerIndex: 4 },
            { commodity: 'jahe gajah', price: 22000, qty: 250, farmerIndex: 0 },
            { commodity: 'tomat buah', price: 12000, qty: 350, farmerIndex: 4 }
        ];

        const createdSupplies = [];
        for (const s of suppliesData) {
            const { user, region } = farmers[s.farmerIndex];
            const latOffset = (Math.random() - 0.5) * 0.04;
            const lngOffset = (Math.random() - 0.5) * 0.04;

            const entry = await prisma.productEntry.create({
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
            createdSupplies.push(entry);
        }

        // 5. Seed Product Entries (DEMAND)
        const demandsData = [
            { commodity: 'beras premium', price: 14700, qty: 500, merchantIndex: 0 },
            { commodity: 'cabai rawit merah', price: 43500, qty: 100, merchantIndex: 1 },
            { commodity: 'bawang merah super', price: 29000, qty: 200, merchantIndex: 2 },
            { commodity: 'kentang dieng', price: 18500, qty: 300, merchantIndex: 3 },
            { commodity: 'jagung manis', price: 9500, qty: 400, merchantIndex: 4 }
        ];

        const createdDemands = [];
        for (const d of demandsData) {
            const { user, region } = merchants[d.merchantIndex];
            const latOffset = (Math.random() - 0.5) * 0.04;
            const lngOffset = (Math.random() - 0.5) * 0.04;

            const entry = await prisma.productEntry.create({
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
            createdDemands.push(entry);
        }

        return NextResponse.json({
            success: true,
            message: "Database berhasil dibersihkan dan di-seed khusus Barlingmascakeb!",
            data: {
                farmersCount: farmers.length,
                merchantsCount: merchants.length,
                suppliesCount: createdSupplies.length,
                demandsCount: createdDemands.length
            }
        });
    } catch (error: any) {
        console.error("Gagal melakukan seeding data:", error);
        return NextResponse.json({
            success: false,
            error: "Gagal membuat data dummy",
            details: error.message
        }, { status: 500 });
    }
}
