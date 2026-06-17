import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Buat User Dummy
        const petani1 = await prisma.user.upsert({
            where: { phoneNumber: '628111111111' },
            update: {},
            create: {
                phoneNumber: '628111111111',
                name: 'Petani Budi',
                role: 'PETANI'
            }
        });

        const pedagang1 = await prisma.user.upsert({
            where: { phoneNumber: '628222222222' },
            update: {},
            create: {
                phoneNumber: '628222222222',
                name: 'Pedagang Siti',
                role: 'PEDAGANG'
            }
        });

        // 2. Buat Product Entry (Supply & Demand Dummy)
        // Hapus data lama (opsional, jika ingin selalu fresh saat di-refresh)
        await prisma.match.deleteMany({});
        await prisma.productEntry.deleteMany({});

        const supply1 = await prisma.productEntry.create({
            data: {
                userId: petani1.id,
                type: 'SUPPLY',
                commodity: 'cabai merah',
                qty: 100,
                price: 35000,
                location: 'Magelang',
                lat: -7.4705,
                lng: 110.2178,
                status: 'ACTIVE'
            }
        });

        const supply2 = await prisma.productEntry.create({
            data: {
                userId: petani1.id,
                type: 'SUPPLY',
                commodity: 'beras premium',
                qty: 500,
                price: 15000,
                location: 'Demak',
                lat: -6.8948,
                lng: 110.6386,
                status: 'ACTIVE'
            }
        });

        const demand1 = await prisma.productEntry.create({
            data: {
                userId: pedagang1.id,
                type: 'DEMAND',
                commodity: 'cabai merah',
                qty: 50,
                price: 38000,
                location: 'Semarang',
                lat: -6.9932,
                lng: 110.4203,
                status: 'ACTIVE'
            }
        });

        const demand2 = await prisma.productEntry.create({
            data: {
                userId: pedagang1.id,
                type: 'DEMAND',
                commodity: 'bawang merah',
                qty: 200,
                price: 25000,
                location: 'Brebes',
                lat: -6.8706,
                lng: 109.0436,
                status: 'ACTIVE'
            }
        });

        // 3. Buatkan juga contoh Dummy Match (transaksi)
        await prisma.match.create({
            data: {
                supplyEntryId: supply1.id,
                demandEntryId: demand1.id,
                status: 'PENDING'
            }
        });

        return NextResponse.json({
            success: true,
            message: "Data dummy berhasil ditambahkan!",
            data: {
                users: [petani1, pedagang1],
                entries: [supply1, supply2, demand1, demand2]
            }
        });
    } catch (error) {
        console.error("Gagal melakukan seeding data:", error);
        return NextResponse.json({
            success: false,
            error: "Gagal membuat data dummy"
        }, { status: 500 });
    }
}
