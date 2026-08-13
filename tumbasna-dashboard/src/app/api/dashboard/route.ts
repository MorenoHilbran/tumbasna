import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to resolve location strings to regencies
function resolveRegency(address: string): string | null {
    if (!address) return null;
    const addr = address.toLowerCase();
    if (addr.includes('banyumas') || addr.includes('pekuncen') || addr.includes('sokaraja') || addr.includes('purwokerto') || addr.includes('baturraden')) {
        return 'Banyumas';
    }
    if (addr.includes('cilacap') || addr.includes('majenang') || addr.includes('sidareja') || addr.includes('kroya') || addr.includes('adipala')) {
        return 'Cilacap';
    }
    if (addr.includes('purbalingga') || addr.includes('bobotsari') || addr.includes('bukateja') || addr.includes('kemangkon')) {
        return 'Purbalingga';
    }
    if (addr.includes('banjarnegara') || addr.includes('dieng') || addr.includes('klampok') || addr.includes('purwonegoro')) {
        return 'Banjarnegara';
    }
    if (addr.includes('kebumen') || addr.includes('gombong') || addr.includes('karanganyar')) {
        return 'Kebumen';
    }
    if (addr.includes('tegal') || addr.includes('slawi') || addr.includes('aderna')) {
        return 'Tegal';
    }
    if (addr.includes('pemalang') || addr.includes('belik')) {
        return 'Pemalang';
    }
    if (addr.includes('brebes')) {
        return 'Brebes';
    }
    return null;
}

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

        // Compute dynamic region statistics
        const allUsers = await prisma.user.findMany();
        const allOrders = await prisma.order.findMany({
            include: { buyer: true }
        });

        const regions = ['banyumas', 'purbalingga', 'banjarnegara', 'cilacap', 'kebumen', 'tegal', 'pemalang', 'brebes'];
        const regionStats: Record<string, any> = {};

        for (const r of regions) {
            const rName = r.charAt(0).toUpperCase() + r.slice(1);
            
            // Filter users by role and location
            const suppliersCount = allUsers.filter(u => u.role === 'PETANI' && resolveRegency(u.address || '') === rName).length;
            const buyersCount = allUsers.filter(u => u.role === 'PEDAGANG' && resolveRegency(u.address || '') === rName).length;

            // Filter entries by location
            const regionEntries = productEntries.filter(e => resolveRegency(e.location) === rName);
            const supplyEntries = regionEntries.filter(e => e.type === 'SUPPLY');
            
            const totalStockKg = supplyEntries.reduce((sum, e) => sum + Number(e.qty), 0);
            const avgPrice = supplyEntries.length > 0
                ? Math.round(supplyEntries.reduce((sum, e) => sum + Number(e.price), 0) / supplyEntries.length)
                : 0;

            const commodities = Array.from(new Set(regionEntries.map(e => e.commodity)));

            // Count orders/transactions in region
            const transactionsCount = allOrders.filter(o => {
                const buyerReg = resolveRegency(o.buyerAddress || o.buyerCity || o.buyer?.address || '');
                const suppReg = resolveRegency(o.supplierLocation || o.supplierCity || '');
                return buyerReg === rName || suppReg === rName;
            }).length;

            // Status berdasarkan aktivitas transaksi real: 'tinggi' (>= 5) vs 'rendah' (< 5)
            const status = transactionsCount >= 5 ? 'tinggi' : 'rendah';

            regionStats[r] = {
                status,
                supplier: suppliersCount,
                buyer: buyersCount,
                stok: totalStockKg > 0 ? `${(totalStockKg / 1000).toFixed(1)} ton` : '0 ton',
                hargaRataRata: avgPrice > 0 ? `Rp ${avgPrice.toLocaleString('id-ID')}/kg` : 'Rp 0/kg',
                transaksi: transactionsCount,
                komoditas: commodities.length > 0 ? commodities : []
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                points,
                supplyCount,
                demandCount,
                recentMatches,
                totalMatchesCount: matchedCount,
                efficiency,
                regionStats
            }
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
