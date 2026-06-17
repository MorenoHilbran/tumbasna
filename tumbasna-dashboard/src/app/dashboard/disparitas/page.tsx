export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import DisparitasHarga from '@/components/DisparitasHarga';

// Helper: maps raw location string → standardized region name (reuse same logic as dashboard)
function getRegion(location: string | null): string {
    if (!location) return 'Tidak Diketahui';
    const loc = location.toLowerCase();
    if (loc.includes('jawa barat') || loc.includes('bandung') || loc.includes('bogor') || loc.includes('bekasi') || loc.includes('garut') || loc.includes('cirebon') || loc.includes('tasik') || loc.includes('depok')) return 'Jawa Barat';
    if (loc.includes('jawa tengah') || loc.includes('semarang') || loc.includes('brebes') || loc.includes('magelang') || loc.includes('solo') || loc.includes('surakarta') || loc.includes('purwokerto') || loc.includes('wonosobo')) return 'Jawa Tengah';
    if (loc.includes('jawa timur') || loc.includes('surabaya') || loc.includes('malang') || loc.includes('banyuwangi') || loc.includes('kediri') || loc.includes('blitar')) return 'Jawa Timur';
    if (loc.includes('jakarta') || loc.includes('dkij') || loc.includes('dki')) return 'DKI Jakarta';
    if (loc.includes('banten') || loc.includes('tangerang') || loc.includes('serang')) return 'Banten';
    if (loc.includes('sumatera') || loc.includes('medan') || loc.includes('palembang') || loc.includes('lampung') || loc.includes('padang') || loc.includes('pekanbaru')) return 'Sumatera';
    if (loc.includes('sulawesi') || loc.includes('makassar') || loc.includes('manado') || loc.includes('palu') || loc.includes('kendari')) return 'Sulawesi';
    if (loc.includes('kalimantan') || loc.includes('balikpapan') || loc.includes('samarinda') || loc.includes('banjarmasin') || loc.includes('pontianak')) return 'Kalimantan';
    if (loc.includes('bali') || loc.includes('denpasar') || loc.includes('lombok') || loc.includes('nusa tenggara')) return 'Bali & Nusa Tenggara';
    if (loc.includes('papua') || loc.includes('maluku') || loc.includes('jayapura') || loc.includes('sorong')) return 'Papua & Maluku';
    if (loc.includes('yogyakarta') || loc.includes('jogja') || loc.includes(' yk') || loc.includes('sleman')) return 'DI Yogyakarta';
    return 'Wilayah Lainnya';
}

export default async function DisparitasPage() {
    const entries = await prisma.productEntry.findMany({
        where: { price: { gt: 0 } },
        select: {
            type: true,
            commodity: true,
            price: true,
            qty: true,
            location: true,
        },
        take: 500,
        orderBy: { createdAt: 'desc' },
    });

    // ── Build region data ─────────────────────────────────────────────────────
    type RegionAcc = {
        supplyPrices: number[];
        demandPrices: number[];
        supplyCount: number;
        demandCount: number;
        commodities: Set<string>;
    };

    const regionMap: Record<string, RegionAcc> = {};

    for (const e of entries) {
        const region = getRegion(e.location);
        if (!regionMap[region]) {
            regionMap[region] = { supplyPrices: [], demandPrices: [], supplyCount: 0, demandCount: 0, commodities: new Set() };
        }
        if (e.price > 0) {
            if (e.type === 'SUPPLY') {
                regionMap[region].supplyPrices.push(e.price);
                regionMap[region].supplyCount++;
            } else {
                regionMap[region].demandPrices.push(e.price);
                regionMap[region].demandCount++;
            }
        }
        regionMap[region].commodities.add(e.commodity);
    }

    const regionData = Object.entries(regionMap)
        .filter(([, v]) => v.supplyCount + v.demandCount > 0)
        .map(([region, v]) => ({
            region,
            supplyAvgPrice: v.supplyPrices.length
                ? v.supplyPrices.reduce((a, b) => a + b, 0) / v.supplyPrices.length
                : 0,
            demandAvgPrice: v.demandPrices.length
                ? v.demandPrices.reduce((a, b) => a + b, 0) / v.demandPrices.length
                : 0,
            supplyCount: v.supplyCount,
            demandCount: v.demandCount,
            commodities: Array.from(v.commodities),
        }));

    // ── Build commodity matrix ────────────────────────────────────────────────
    type CommodityAcc = Record<string, { total: number; count: number }>;
    const commodityRegionMap: Record<string, CommodityAcc> = {};

    for (const e of entries) {
        if (e.type !== 'SUPPLY' || e.price <= 0) continue;
        const region = getRegion(e.location);
        const comm = e.commodity.toLowerCase();
        if (!commodityRegionMap[comm]) commodityRegionMap[comm] = {};
        if (!commodityRegionMap[comm][region]) commodityRegionMap[comm][region] = { total: 0, count: 0 };
        commodityRegionMap[comm][region].total += e.price;
        commodityRegionMap[comm][region].count++;
    }

    const commodityMatrix = Object.entries(commodityRegionMap)
        .map(([commodity, regionPrices]) => ({
            commodity,
            regions: Object.entries(regionPrices).map(([region, { total, count }]) => ({
                region,
                avgPrice: Math.round(total / count),
                count,
            })).sort((a, b) => b.avgPrice - a.avgPrice),
        }))
        .filter(c => c.regions.length > 0)
        .sort((a, b) => b.regions.length - a.regions.length)
        .slice(0, 10); // top 10 commodities

    return (
        <DisparitasHarga
            regionData={regionData}
            commodityMatrix={commodityMatrix}
        />
    );
}
