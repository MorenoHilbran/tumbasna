'use client';

import { useState } from 'react';
import { LineChart, TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Region = {
    region: string;
    supplyAvgPrice: number;
    demandAvgPrice: number;
    supplyCount: number;
    demandCount: number;
    commodities: string[];
};

type CommodityRow = {
    commodity: string;
    regions: { region: string; avgPrice: number; count: number }[];
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DisparitasHarga({
    regionData,
    commodityMatrix,
}: {
    regionData: Region[];
    commodityMatrix: CommodityRow[];
}) {
    const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
    const commodities = ['all', ...commodityMatrix.map(c => c.commodity)];

    // Filter by commodity selection
    const filteredRegions =
        selectedCommodity === 'all'
            ? regionData
            : regionData.filter(r =>
                r.commodities.map(c => c.toLowerCase()).includes(selectedCommodity.toLowerCase())
            );

    // Calculate national stats
    const allSupplyPrices = regionData.flatMap(r => r.supplyAvgPrice > 0 ? [r.supplyAvgPrice] : []);
    const allDemandPrices = regionData.flatMap(r => r.demandAvgPrice > 0 ? [r.demandAvgPrice] : []);
    const nationalSupplyAvg = allSupplyPrices.length
        ? Math.round(allSupplyPrices.reduce((a, b) => a + b, 0) / allSupplyPrices.length)
        : 0;
    const nationalDemandAvg = allDemandPrices.length
        ? Math.round(allDemandPrices.reduce((a, b) => a + b, 0) / allDemandPrices.length)
        : 0;
    const spreadPercent = nationalDemandAvg > 0
        ? (((nationalDemandAvg - nationalSupplyAvg) / nationalDemandAvg) * 100).toFixed(1)
        : '0.0';

    // High disparity: demand > 120% of supply
    const highDisparityCount = filteredRegions.filter(r =>
        r.supplyAvgPrice > 0 && r.demandAvgPrice > 0 &&
        r.demandAvgPrice / r.supplyAvgPrice > 1.20
    ).length;

    // Sort filtered regions by disparity (highest first)
    const sorted = [...filteredRegions].sort((a, b) => {
        const dispA = a.supplyAvgPrice > 0 ? a.demandAvgPrice / a.supplyAvgPrice : 0;
        const dispB = b.supplyAvgPrice > 0 ? b.demandAvgPrice / b.supplyAvgPrice : 0;
        return dispB - dispA;
    });

    function DisparityBadge({ supply, demand }: { supply: number; demand: number }) {
        if (supply === 0 || demand === 0) {
            return <span className="text-[10px] text-slate-500 italic">Data tidak lengkap</span>;
        }
        const ratio = demand / supply;
        const pct = ((ratio - 1) * 100).toFixed(1);
        if (ratio > 1.20) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    <TrendingUp className="w-3 h-3" /> +{pct}% Disparitas Tinggi
                </span>
            );
        } else if (ratio > 1.05) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <TrendingUp className="w-3 h-3" /> +{pct}% Wajar
                </span>
            );
        } else if (ratio < 0.95) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <TrendingDown className="w-3 h-3" /> {pct}% Di Bawah
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Minus className="w-3 h-3" /> Seimbang
            </span>
        );
    }

    // Simple inline bar chart for commodity matrix
    function MatrixBar({ value, max }: { value: number; max: number }) {
        const pct = max > 0 ? (value / max) * 100 : 0;
        return (
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-[10px] text-slate-400 w-20 text-right">
                    {value > 0 ? `Rp ${value.toLocaleString('id-ID')}` : '—'}
                </span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <LineChart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-blue-600/60">
                        Bank Indonesia · Analitik Harga
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Disparitas Harga{' '}
                    <span className="text-blue-600">
                        Antar Wilayah
                    </span>
                </h1>
                <p className="text-base text-slate-500 mt-2 font-medium max-w-2xl leading-relaxed">
                    Perbandingan harga SUPPLY vs DEMAND secara nasional.
                </p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Terpantau', value: regionData.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tooltip: 'Jumlah provinsi/wilayah yang aktif mengirimkan data harga harian.' },
                    { label: 'Kritis', value: highDisparityCount, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', tooltip: 'Jumlah wilayah dengan selisih harga supply-demand di atas 30%.' },
                    { label: 'Supply Avg', value: nationalSupplyAvg > 0 ? `Rp ${nationalSupplyAvg.toLocaleString('id-ID')}` : '—', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tooltip: 'Rata-rata harga beli di tingkat petani secara nasional.' },
                    { label: 'Market Spread', value: `${spreadPercent}%`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tooltip: 'Persentase margin rata-rata antara harga petani dan harga pasar.' },
                ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between w-full mb-3">
                            <div className={`px-2.5 py-1 rounded-lg ${k.bg} ${k.color} text-xs font-bold border ${k.border} inline-block`}>
                                {k.label}
                            </div>
                            <div className="relative group/tooltip">
                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                    {k.tooltip}
                                </div>
                            </div>
                        </div>
                        <p className={`text-2xl font-bold text-slate-900 tracking-tight`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Commodity filter */}
            <div className="flex flex-wrap gap-1.5 mb-6">
                {commodities.map(c => (
                    <button
                        key={c}
                        onClick={() => setSelectedCommodity(c)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 border capitalize tracking-widest ${selectedCommodity === c
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                            }`}
                    >
                        {c === 'all' ? 'SEMUA' : c}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Region Disparity Table */}
                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-start gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Disparitas Per Wilayah</h2>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Data real-time</p>
                            </div>
                            <div className="relative group/tooltip mt-1">
                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                <div className="absolute top-6 left-0 w-56 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                    Membandingkan rata-rata harga di tingkat petani (Pasokan) vs harga di pasar/pedagang (Permintaan) per provinsi.
                                </div>
                            </div>
                        </div>
                        {highDisparityCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100 text-[9px] font-bold uppercase tracking-widest">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {highDisparityCount} Kritis
                            </div>
                        )}
                    </div>

                    {sorted.length === 0 ? (
                        <div className="p-16 text-center">
                            <Info className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-base font-bold text-slate-800">No Data Available</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50/50 border-marker border-b border-slate-100">
                                        <th className="text-left px-6 py-3 text-[12px] text-slate-400 font-bold tracking-tight">Wilayah</th>
                                        <th className="text-right px-6 py-3 text-[12px] text-slate-400 font-bold tracking-tight">Supply</th>
                                        <th className="text-right px-6 py-3 text-[12px] text-slate-400 font-bold tracking-tight">Demand</th>
                                        <th className="text-center px-6 py-3 text-[12px] text-slate-400 font-bold tracking-tight">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sorted.map((r) => (
                                        <tr key={r.region} className="hover:bg-blue-50/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 text-sm tracking-tight">{r.region}</p>
                                                <div className="text-[11px] text-blue-600 font-bold tracking-tight mt-0.5 opacity-60 w-full overflow-hidden">
                                                    <div className="running-text-container">
                                                        <span className="running-text-content">
                                                            {r.commodities.join(', ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-emerald-700 font-mono text-[11px] font-bold">
                                                    {r.supplyAvgPrice > 0 ? `Rp${Math.round(r.supplyAvgPrice).toLocaleString('id-ID')}` : '—'}
                                                </div>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{r.supplyCount} lap</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-amber-700 font-mono text-[11px] font-bold">
                                                    {r.demandAvgPrice > 0 ? `Rp${Math.round(r.demandAvgPrice).toLocaleString('id-ID')}` : '—'}
                                                </div>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{r.demandCount} lap</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    const supply = r.supplyAvgPrice;
                                                    const demand = r.demandAvgPrice;
                                                    if (supply === 0 || demand === 0) return <span className="text-[8px] text-slate-300 italic">N/A</span>;
                                                    const ratio = demand / supply;
                                                    const pct = ((ratio - 1) * 100).toFixed(1);
                                                    if (ratio > 1.20) return <span className="px-2 py-1 rounded-md text-[8px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-widest">KRITIS (+{pct}%)</span>;
                                                    if (ratio > 1.05) return <span className="px-2 py-1 rounded-md text-[8px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest">WAJAR</span>;
                                                    return <span className="px-2 py-1 rounded-md text-[8px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-widest">STABIL</span>;
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Commodity Price Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Matriks Harga</h2>
                                <p className="text-[11px] text-slate-500 font-medium">Supply per komoditas nasional</p>
                            </div>
                            <div className="relative group/tooltip mt-1">
                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                <div className="absolute top-6 right-0 w-56 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                    Menampilkan 5 komoditas teratas dengan penyebaran harga tertinggi di seluruh Indonesia.
                                </div>
                            </div>
                        </div>
                    </div>

                    {commodityMatrix.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                            <Info className="w-6 h-6 mx-auto mb-2 text-slate-200" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Data</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {commodityMatrix.slice(0, 5).map(row => {
                                const maxPrice = Math.max(...row.regions.map(r => r.avgPrice));
                                return (
                                    <div key={row.commodity} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-900 capitalize tracking-tight">{row.commodity}</span>
                                            <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-widest">{row.regions.length} REGION</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            {row.regions.slice(0, 2).map(reg => (
                                                <div key={reg.region}>
                                                    <div className="flex justify-between text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                                        <span>{reg.region}</span>
                                                        <span className="text-slate-900">Rp{reg.avgPrice.toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                                            style={{ width: `${(reg.avgPrice / maxPrice) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Status Indicator</p>
                        {[
                            { label: 'Disparitas Kritis (>20%)', color: 'bg-red-500', text: 'text-red-700' },
                            { label: 'Wajar (5–20%)', color: 'bg-amber-400', text: 'text-amber-700' },
                            { label: 'Stabil / Seimbang', color: 'bg-emerald-500', text: 'text-emerald-700' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${l.color} shadow-sm`} />
                                <span className={`text-[10px] font-bold ${l.text} opacity-80 tracking-tight`}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
