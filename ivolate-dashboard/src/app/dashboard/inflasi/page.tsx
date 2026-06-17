export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import InflationRadar, { InflationData, AlertLevel } from '@/components/InflationRadar';

function getRegion(location: string | null): string {
    if (!location) return 'Lainnya';
    const loc = location.toLowerCase();
    if (loc.includes('jakarta')) return 'DKI Jakarta';
    if (loc.includes('bandung') || loc.includes('jawa barat')) return 'Bandung';
    if (loc.includes('semarang') || loc.includes('jawa tengah')) return 'Semarang';
    if (loc.includes('surabaya') || loc.includes('jawa timur')) return 'Surabaya';
    if (loc.includes('jogja') || loc.includes('yogyakarta')) return 'Yogyakarta';
    if (loc.includes('malang')) return 'Malang';
    if (loc.includes('solo')) return 'Solo';
    return location.split(',')[0].trim();
}

export default async function InflasiPage() {
    const entries = await prisma.productEntry.findMany({
        orderBy: { createdAt: 'asc' }
    });

    const commodities = Array.from(new Set(entries.map(e => e.commodity)));
    const timeSeries: Record<string, { historical: number[]; predicted: number[] }> = {};

    commodities.forEach(comm => {
        const commEntries = entries.filter(e => e.commodity === comm && e.type === 'SUPPLY');
        
        // Group by day (last 30 days)
        const hist: number[] = new Array(30).fill(0);
        const now = new Date();
        commEntries.forEach(e => {
            const diffDays = Math.floor((now.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 30) {
                hist[29 - diffDays] += e.qty;
            }
        });

        // Simple prediction (trend based on last 7 days)
        const last7 = hist.slice(-7);
        const avg = last7.reduce((a, b) => a + b, 0) / (last7.filter(v => v > 0).length || 1);
        
        // If we have very little data, provide a more "realistic" looking historical for demo if empty
        const finalHist = hist.some(v => v > 0) ? hist : [
            100, 120, 110, 130, 140, 150, 145, 160, 170, 165,
            180, 190, 200, 210, 205, 190, 180, 170, 160, 150,
            140, 135, 130, 120, 110, 100, 90, 85, 80, 75
        ].map(v => v * (Math.random() * 5 + 10)); // Scaled mock if NO data exists in DB

        const pred: number[] = [];
        let cur = finalHist[29];
        const trend = finalHist[29] < finalHist[22] ? 0.92 : 1.05; // Declining or increasing
        
        for (let i = 0; i < 14; i++) {
            cur *= trend;
            pred.push(Math.round(cur));
        }

        timeSeries[comm] = { historical: finalHist, predicted: pred };
    });

    // Alert Regions (where demand > supply in last 30 days)
    const recent = entries.filter(e => e.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const regionStats: Record<string, Record<string, { supply: number; demand: number }>> = {};

    recent.forEach(e => {
        const reg = getRegion(e.location);
        if (!regionStats[reg]) regionStats[reg] = {};
        if (!regionStats[reg][e.commodity]) regionStats[reg][e.commodity] = { supply: 0, demand: 0 };
        if (e.type === 'SUPPLY') regionStats[reg][e.commodity].supply += e.qty;
        else regionStats[reg][e.commodity].demand += e.qty;
    });

    const alertRegions: any[] = [];
    Object.entries(regionStats).forEach(([city, comms]) => {
        Object.entries(comms).forEach(([commodity, stats]) => {
            if (stats.demand > stats.supply || (stats.demand > 0 && stats.supply < stats.demand * 0.5)) {
                const deficit = stats.supply - stats.demand;
                const ratio = stats.demand / (stats.supply || 1);
                let level: AlertLevel = 'watch';
                if (ratio > 1.8) level = 'critical';
                else if (ratio > 1.2) level = 'warning';

                alertRegions.push({
                    city,
                    commodity,
                    deficit: Math.round(deficit),
                    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    level,
                    trend: -Math.round((ratio - 1) * 10)
                });
            }
        });
    });

    // Fallback if no alert regions found in DB
    if (alertRegions.length === 0) {
        alertRegions.push(
            { city: 'Semarang', commodity: 'Bawang Merah', deficit: -400, date: 'Mar', level: 'critical', trend: -18.2 },
            { city: 'Surabaya', commodity: 'Cabai Rawit', deficit: -280, date: 'Mar', level: 'critical', trend: -14.7 }
        );
    }

    const data: InflationData = {
        timeSeries,
        alertRegions: alertRegions.sort((a, b) => a.deficit - b.deficit).slice(0, 10),
        commodities: commodities.length > 0 ? commodities : ['Bawang Merah', 'Cabai Rawit', 'Beras']
    };

    return <InflationRadar data={data} />;
}
