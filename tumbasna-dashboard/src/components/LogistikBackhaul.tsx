'use client';

import { useState } from 'react';
import { Truck, MapPin, Package, ArrowRight, Clock, CheckCircle, AlertCircle, Zap, Info } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BackhaulMatch = {
    id: string;
    commodity: string;
    supplyLocation: string;
    demandLocation: string;
    supplyQty: number;
    demandQty: number;
    supplyPrice: number;
    demandPrice: number;
    distanceKm: number | null;
    status: string;
    matchedAt: string;
    supplyPhone: string;
    demandPhone: string;
};

type Stats = {
    totalMatches: number;
    pendingMatches: number;
    acceptedMatches: number;
    totalQtyMoved: number;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LogistikBackhaul({
    matches,
    stats,
}: {
    matches: BackhaulMatch[];
    stats: Stats;
}) {
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');

    const filtered = matches.filter(m => filter === 'ALL' || m.status === filter);

    function StatusChip({ status }: { status: string }) {
        if (status === 'ACCEPTED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle className="w-3.5 h-3.5" /> Diterima
                </span>
            );
        }
        if (status === 'REJECTED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5" /> Ditolak
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-3.5 h-3.5" /> Menunggu
            </span>
        );
    }

    function PriceDiff({ supply, demand }: { supply: number; demand: number }) {
        if (!supply || !demand) return null;
        const diff = demand - supply;
        const pct = ((diff / demand) * 100).toFixed(1);
        return (
            <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {diff > 0 ? '+' : ''}{pct}%
            </span>
        );
    }

    // Simple SVG route visualization
    function RouteVisual({ distanceKm }: { distanceKm: number | null }) {
        return (
            <div className="flex items-center gap-2 my-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                <div className="flex-1 h-px bg-slate-200 relative group-hover:bg-emerald-200 transition-colors">
                    {distanceKm && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[12px] font-bold text-slate-400 whitespace-nowrap">
                            {distanceKm.toFixed(0)} KM
                        </span>
                    )}
                    <Truck className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-emerald-600 bg-[#F8FAFC] px-0.5" />
                </div>
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Truck className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600/60">
                        Smart Logistics · Indonesia
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Logistik{' '}
                    <span className="text-emerald-600">
                        Backhaul
                    </span>
                </h1>
                <p className="text-base text-slate-500 mt-2 font-medium max-w-2xl leading-relaxed">
                    Visualisasi log pencocokan real-time untuk optimasi rantai pasok nasional.
                </p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Match', value: stats.totalMatches, color: 'text-emerald-600', bg: 'bg-emerald-50', tooltip: 'Jumlah total pencocokan rute yang ditemukan oleh Smart Matching Engine.' },
                    { label: 'Pending', value: stats.pendingMatches, color: 'text-amber-600', bg: 'bg-amber-50', tooltip: 'Pencocokan yang menunggu konfirmasi dari pihak pengirim/penerima.' },
                    { label: 'Berhasil', value: stats.acceptedMatches, color: 'text-emerald-600', bg: 'bg-emerald-50', tooltip: 'Transaksi backhaul yang telah disepakati dan siap jalan.' },
                    {
                        label: 'Volume',
                        value: stats.totalQtyMoved > 0 ? `${stats.totalQtyMoved.toLocaleString('id-ID')} kg` : '0 kg',
                        color: 'text-indigo-600',
                        bg: 'bg-indigo-50',
                        tooltip: 'Estimasi total volume pangan yang berhasil dipindahkan melalui rute backhaul.'
                    },
                ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between w-full mb-3">
                            <div className={`px-3 py-1 rounded-lg ${k.bg} ${k.color} text-xs font-bold border border-transparent inline-block`}>
                                {k.label}
                            </div>
                            <div className="relative group/tooltip">
                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-500 transition-colors cursor-help" />
                                <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                    {k.tooltip}
                                </div>
                            </div>
                        </div>
                        <p className={`text-2xl font-bold text-slate-900 tracking-tight`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Algorithm Info Banner */}
            <div className="flex items-start gap-4 px-6 py-4 mb-6 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-600/10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-2xl transition-transform group-hover:scale-110 duration-1000" />
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="relative z-10">
                    <p className="text-base font-bold mb-0.5 tracking-tight">Smart Matching Engine Aktif</p>
                    <p className="text-[11px] text-emerald-50/90 leading-relaxed font-medium">
                        Otomatis berdasarkan <strong className="text-white">Haversine ≤100 km</strong> dan <strong className="text-white">harga ≤15%</strong>.
                    </p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {(['ALL', 'PENDING', 'ACCEPTED'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all duration-300 border uppercase tracking-widest ${filter === f
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                    >
                        {f === 'ALL' ? `Semua (${matches.length})` : f === 'PENDING' ? `Pending (${stats.pendingMatches})` : `Berhasil (${stats.acceptedMatches})`}
                    </button>
                ))}
            </div>

            {/* Match Cards */}
            {filtered.length === 0 ? (
                <div className="rounded-3xl bg-white border border-slate-200 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                        <Truck className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-xl font-bold text-slate-900 tracking-tight">Belum ada data pencocokan</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                        Data supply–demand belum mencapai kriteria Smart Matching.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((match) => (
                        <div
                            key={match.id}
                            className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-emerald-300 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[2rem] -mr-8 -mt-8 transition-colors group-hover:bg-emerald-50" />
                            
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all">
                                        <Package className="w-5 h-5 text-emerald-600 group-hover:text-white transition-all" />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-900 capitalize tracking-tight">{match.commodity}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">{new Date(match.matchedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <StatusChip status={match.status} />
                            </div>

                            {/* Route Visualization */}
                            <RouteVisual distanceKm={match.distanceKm} />

                            {/* Cards for Supply and Demand */}
                            <div className="space-y-3 mt-6">
                                {/* Supply */}
                                <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 transition-all group-hover:bg-emerald-50 relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
                                        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Supply Area</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="p-1.5 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-900 font-bold leading-tight mb-0.5">{match.supplyLocation}</p>
                                            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{match.supplyPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex-1 bg-white/60 rounded-xl p-2.5 border border-emerald-100/50">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Vol</p>
                                            <p className="text-sm font-bold text-slate-900">{match.supplyQty} <span className="text-[9px] opacity-40">KG</span></p>
                                        </div>
                                        <div className="flex-1 bg-white/60 rounded-xl p-2.5 border border-emerald-100/50 text-right">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Price</p>
                                            <p className="text-sm font-bold text-emerald-600">Rp {match.supplyPrice.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Demand */}
                                <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-4 transition-all group-hover:bg-amber-50 relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40" />
                                        <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Demand Area</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="p-1.5 bg-white rounded-lg border border-amber-100 shadow-sm">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-900 font-bold leading-tight mb-0.5">{match.demandLocation}</p>
                                            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{match.demandPhone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex-1 bg-white/60 rounded-xl p-2.5 border border-amber-100/50">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Vol</p>
                                            <p className="text-sm font-bold text-slate-900">{match.demandQty} <span className="text-[9px] opacity-40">KG</span></p>
                                        </div>
                                        <div className="flex-1 bg-white/60 rounded-xl p-2.5 border border-amber-100/50 text-right">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Budget</p>
                                            <p className="text-sm font-bold text-amber-600">Rp {match.demandPrice.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 group-hover:bg-white transition-colors">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PROFIT:</span>
                                        <PriceDiff supply={match.supplyPrice} demand={match.demandPrice} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] text-slate-300 font-bold font-mono tracking-tighter uppercase mb-0.5">
                                        #{match.id.substring(0, 8)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
