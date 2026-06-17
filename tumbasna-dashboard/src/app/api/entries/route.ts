import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Missing phone parameter' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { phoneNumber: phone },
            include: {
                productEntries: {
                    orderBy: { createdAt: 'desc' },
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({
            success: true,
            data: user.productEntries
        });

    } catch (error) {
        console.error("Gagal ambil data user entries:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Pastikan user dummy pengirim data ini sudah ada
        const user = await prisma.user.upsert({
            where: { phoneNumber: payload.userId },
            update: {},
            create: {
                phoneNumber: payload.userId,
                name: `User-${payload.userId.substring(payload.userId.length - 4)}`,
                role: payload.type === 'SUPPLY' ? 'PETANI' : 'PEDAGANG'
            }
        });

        // Simpan data langsung ke database
        const entry = await prisma.productEntry.create({
            data: {
                userId: user.id,
                type: payload.type,
                commodity: payload.commodity.toLowerCase(),
                qty: Number(payload.qty),
                price: Number(payload.price),
                location: payload.location,
                lat: payload.lat || null,
                lng: payload.lng || null,
                status: payload.status || 'ACTIVE'
            }
        });

        return NextResponse.json({
            success: true,
            message: "Data berhasil dimasukkan lewat API POST langsung!",
            data: entry
        });
    } catch (error) {
        console.error("Gagal simpan data dari Direct POST API:", error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
