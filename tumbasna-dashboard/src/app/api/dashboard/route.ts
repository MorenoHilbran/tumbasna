import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch hotspots data
        const productEntries = await prisma.productEntry.findMany({
            where: { lat: { not: null }, lng: { not: null } },
            take: 200,
        });

        const points = productEntries.map((e) => ({
            id: e.id,
            lat: e.lat!,
            lng: e.lng!,
            type: e.type,
            commodity: e.commodity,
            qty: e.qty,
            location: e.location,
        }));

        // Calculate basic analytics for Volatile Foods
        const supplyCount = await prisma.productEntry.count({ where: { type: 'SUPPLY' } });
        const demandCount = await prisma.productEntry.count({ where: { type: 'DEMAND' } });
        const matchedCount = await prisma.match.count({ where: { status: 'MATCHED' } });
        
        // Efficiency: roughly (matchedCount / totalEntries) * 100 with a baseline
        const efficiency = supplyCount + demandCount > 0 
            ? Math.min(Math.round((matchedCount * 2 / (supplyCount + demandCount)) * 100) + 10, 95)
            : 0;

        // Fetch recent matches
        const recentMatches = await prisma.match.findMany({
            take: 25,
            orderBy: { createdAt: "desc" },
            include: {
                supplyEntry: { include: { user: true } },
                demandEntry: { include: { user: true } },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                points,
                supplyCount,
                demandCount,
                recentMatches,
                totalMatchesCount: matchedCount,
                efficiency
            }
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
