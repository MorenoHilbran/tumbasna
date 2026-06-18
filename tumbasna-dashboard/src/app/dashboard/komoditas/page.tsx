'use client';

import { useState } from 'react';
import {
    Package,
    Search,
    TrendingUp,
    TrendingDown,
    Minus,
    MapPin,
    Filter,
    ArrowUpDown,
    BarChart3,
    AlertTriangle,
    Download,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
const commodities = [
    { id: 1, nama: 'Beras Premium', kategori: 'Pangan Pokok', harga: 14200, stok: 3240, satuan: 'ton', lokasi: 'Banyumas', tren: 'naik', pctChange: 2.4, status: 'aman', hariData: [13800, 14000, 13900, 14100, 14200, 14200, 14200] },
    { id: 2, nama: 'Beras Medium', kategori: 'Pangan Pokok', harga: 11500, stok: 2180, satuan: 'ton', lokasi: 'Cilacap', tren: 'naik', pctChange: 1.8, status: 'aman', hariData: [11200, 11300, 11400, 11400, 11500, 11500, 11500] },
    { id: 3, nama: 'Cabai Merah', kategori: 'Hortikultura', harga: 38500, stok: 94, satuan: 'ton', lokasi: 'Banyumas', tren: 'naik', pctChange: 12.3, status: 'waspada', hariData: [34000, 35200, 36100, 36800, 37500, 38000, 38500] },
    { id: 4, nama: 'Cabai Rawit', kategori: 'Hortikultura', harga: 45000, stok: 42, satuan: 'ton', lokasi: 'Purbalingga', tren: 'naik', pctChange: 18.7, status: 'kritis', hariData: [37800, 39200, 40500, 42000, 43500, 44200, 45000] },
    { id: 5, nama: 'Bawang Merah', kategori: 'Hortikultura', harga: 28000, stok: 186, satuan: 'ton', lokasi: 'Banyumas', tren: 'turun', pctChange: -3.4, status: 'aman', hariData: [29000, 28800, 28600, 28400, 28200, 28100, 28000] },
    { id: 6, nama: 'Bawang Putih', kategori: 'Hortikultura', harga: 32500, stok: 118, satuan: 'ton', lokasi: 'Cilacap', tren: 'stabil', pctChange: 0.2, status: 'aman', hariData: [32400, 32400, 32500, 32400, 32500, 32500, 32500] },
    { id: 7, nama: 'Jagung Pipil', kategori: 'Pangan Pokok', harga: 6800, stok: 1540, satuan: 'ton', lokasi: 'Cilacap', tren: 'turun', pctChange: -1.4, status: 'aman', hariData: [6900, 6880, 6860, 6840, 6820, 6810, 6800] },
    { id: 8, nama: 'Kedelai Lokal', kategori: 'Pangan Pokok', harga: 9800, stok: 520, satuan: 'ton', lokasi: 'Banjarnegara', tren: 'stabil', pctChange: 0.5, status: 'aman', hariData: [9750, 9760, 9780, 9780, 9790, 9800, 9800] },
    { id: 9, nama: 'Gula Pasir', kategori: 'Pangan Pokok', harga: 15500, stok: 310, satuan: 'ton', lokasi: 'Kebumen', tren: 'naik', pctChange: 3.1, status: 'waspada', hariData: [15000, 15100, 15200, 15300, 15400, 15450, 15500] },
    { id: 10, nama: 'Minyak Goreng', kategori: 'Pangan Pokok', harga: 17800, stok: 240, satuan: 'ton', lokasi: 'Cilacap', tren: 'stabil', pctChange: 0.0, status: 'aman', hariData: [17800, 17800, 17800, 17800, 17800, 17800, 17800] },
    { id: 11, nama: 'Kentang', kategori: 'Hortikultura', harga: 12000, stok: 280, satuan: 'ton', lokasi: 'Banjarnegara', tren: 'turun', pctChange: -2.0, status: 'aman', hariData: [12240, 12200, 12150, 12100, 12080, 12040, 12000] },
    { id: 12, nama: 'Tomat', kategori: 'Hortikultura', harga: 8500, stok: 56, satuan: 'ton', lokasi: 'Kebumen', tren: 'naik', pctChange: 6.2, status: 'waspada', hariData: [8000, 8100, 8200, 8300, 8400, 8450, 8500] },
];

const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// ─── Mini Sparkline ───────────────────────────────────────────
function Sparkline({ data, tren }: { data: number[]; tren: string }) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 60, h = 24;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');

    const strokeColor = tren === 'naik' ? '#10B981' : tren === 'turun' ? '#10B981' : '#94A3B8'; // Emerald, Emerald, Slate-400

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={pts} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ─── Price Chart ──────────────────────────────────────────────
function PriceChart({ komoditas }: { komoditas: typeof commodities[0] }) {
    const max = Math.max(...komoditas.hariData);
    const min = Math.min(...komoditas.hariData);
    const range = max - min || 1;
    const h = 120;

    const lineColor = komoditas.tren === 'naik' ? '#10B981' : komoditas.tren === 'turun' ? '#059669' : '#94A3B8';

    return (
        <div style={{ height: h, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height={h} preserveAspectRatio="none" viewBox={`0 0 100 ${h}`}>
                <polyline
                    points={komoditas.hariData.map((v, i) => {
                        const x = (i / (komoditas.hariData.length - 1)) * 100;
                        const y = h - ((v - min) / range) * (h - 20) - 10;
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={2}
                />
            </svg>
            {/* Day labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                {weekDays.map((d) => (
                    <span key={d} className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{d}</span>
                ))}
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────
function StockStatus({ status }: { status: string }) {
    const map: Record<string, { bg: string; label: string }> = {
        aman: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/50', label: 'Aman' },
        waspada: { bg: 'bg-amber-50 text-amber-600 border-amber-100/50', label: 'Waspada' },
        kritis: { bg: 'bg-rose-50 text-rose-600 border-rose-100/50', label: 'Kritis' },
    };
    const s = map[status] ?? map.aman;
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.bg}`}>
            {s.label}
        </span>
    );
}

// ─── Main Komoditas Page ──────────────────────────────────────
export default function KomoditasPage() {
    const [search, setSearch] = useState('');
    const [kategoriFilter, setKategoriFilter] = useState('Semua');
    const [selectedKomoditas, setSelectedKomoditas] = useState(commodities[2]);
    const [sortBy, setSortBy] = useState<'harga' | 'stok'>('harga');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const filtered = commodities
        .filter(c =>
            c.nama.toLowerCase().includes(search.toLowerCase()) &&
            (kategoriFilter === 'Semua' || c.kategori === kategoriFilter)
        )
        .sort((a, b) => {
            const v = sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy];
            return v;
        });

    return (
        <div className="p-8 space-y-8 bg-[#F8FAFC]">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Monitoring Komoditas</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Tracking harga, stok, dan titik lokasi komoditas pangan
                    </p>
                </div>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs rounded-xl shadow-sm self-start md:self-auto"
                >
                    <Download className="w-4 h-4 text-emerald-600" />
                    Export Data
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Komoditas', value: commodities.length, color: 'text-emerald-600', bg: 'bg-emerald-50/70', icon: Package },
                    { label: 'Status Kritis', value: commodities.filter(c => c.status === 'kritis').length, color: 'text-rose-600', bg: 'bg-rose-50/70', icon: AlertTriangle },
                    { label: 'Harga Naik', value: commodities.filter(c => c.tren === 'naik').length, color: 'text-emerald-600', bg: 'bg-emerald-50/70', icon: TrendingUp },
                    { label: 'Harga Turun', value: commodities.filter(c => c.tren === 'turun').length, color: 'text-emerald-500', bg: 'bg-emerald-50/70', icon: TrendingDown },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                <s.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
                                <p className="text-2xl font-extrabold text-slate-800 mt-1.5 leading-none">{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Table + Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Table */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
                    {/* Table Controls */}
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        {/* Search */}
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 w-full sm:w-64 transition-all">
                            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari komoditas..."
                                className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400 font-semibold"
                            />
                        </div>

                        {/* Category filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                                <Filter className="w-3.5 h-3.5 text-emerald-500" />
                                Kategori:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/40">
                                {['Semua', 'Pangan Pokok', 'Hortikultura'].map(k => {
                                    const isAct = kategoriFilter === k;
                                    return (
                                        <button
                                            key={k}
                                            onClick={() => setKategoriFilter(k)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                                isAct 
                                                    ? 'bg-white text-slate-800 shadow-sm' 
                                                    : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                        >
                                            {k}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {[
                                        { key: 'nama', label: 'Produk' },
                                        { key: 'harga', label: 'Harga/kg', sortable: true },
                                        { key: 'stok', label: 'Stok', sortable: true },
                                        { key: 'lokasi', label: 'Lokasi' },
                                        { key: 'tren', label: 'Tren 7H' },
                                        { key: 'status', label: 'Status' },
                                    ].map(col => (
                                        <th
                                            key={col.key}
                                            className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>{col.label}</span>
                                                {col.sortable && (
                                                    <button 
                                                        onClick={() => {
                                                            if (sortBy === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                            else { setSortBy(col.key as any); setSortDir('desc'); }
                                                        }}
                                                        className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                                                    >
                                                        <ArrowUpDown className={`w-3.5 h-3.5 ${
                                                            sortBy === col.key ? 'text-emerald-600' : 'text-slate-300'
                                                        }`} />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((c) => {
                                    const isSelected = selectedKomoditas.id === c.id;
                                    return (
                                        <tr
                                            key={c.id}
                                            onClick={() => setSelectedKomoditas(c)}
                                            className={`cursor-pointer transition-all duration-150 ${
                                                isSelected 
                                                    ? 'bg-emerald-50/20 border-l-2 border-l-emerald-600' 
                                                    : 'hover:bg-slate-50/50 border-l-2 border-l-transparent'
                                            }`}
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{c.nama}</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold">{c.kategori}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-xs font-bold text-slate-800">Rp {c.harga.toLocaleString('id-ID')}</p>
                                                <p className={`text-[9px] font-bold flex items-center gap-0.5 mt-0.5 ${
                                                    c.pctChange > 0 ? 'text-emerald-600' : c.pctChange < 0 ? 'text-emerald-650' : 'text-slate-400'
                                                }`}>
                                                    {c.pctChange > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : c.pctChange < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                                                    {Math.abs(c.pctChange)}%
                                                </p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-xs font-bold text-slate-700">{c.stok.toLocaleString('id-ID')} {c.satuan}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1 text-slate-500">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-semibold">{c.lokasi}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <Sparkline data={c.hariData} tren={c.tren} />
                                            </td>
                                            <td className="px-5 py-3">
                                                <StockStatus status={c.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menampilkan {filtered.length} dari {commodities.length} komoditas</p>
                    </div>
                </div>

                {/* Detail Chart Panel */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Detail Komoditas</h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-5">Klik baris tabel untuk melihat grafik</p>

                        {/* Selected commodity info */}
                        <div className="rounded-2xl p-5 mb-5 bg-slate-50 border border-slate-100">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800">{selectedKomoditas.nama}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{selectedKomoditas.kategori} • {selectedKomoditas.lokasi}</p>
                                </div>
                                <StockStatus status={selectedKomoditas.status} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Harga Saat Ini</p>
                                    <p className="text-base font-extrabold text-slate-800 mt-1.5 leading-none">Rp {selectedKomoditas.harga.toLocaleString('id-ID')}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Stok Tersedia</p>
                                    <p className="text-base font-extrabold text-slate-800 mt-1.5 leading-none">{selectedKomoditas.stok.toLocaleString('id-ID')} {selectedKomoditas.satuan}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center">
                                <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                    selectedKomoditas.pctChange > 5 ? 'bg-amber-50 text-amber-600 border border-amber-100/50' : selectedKomoditas.pctChange < 0 ? 'bg-emerald-50/70 text-emerald-700 border border-emerald-100/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                                }`}>
                                    {selectedKomoditas.pctChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {selectedKomoditas.pctChange > 0 ? '+' : ''}{selectedKomoditas.pctChange}% (7 hari)
                                </div>
                            </div>
                        </div>

                        {/* Price Chart */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grafik Harga 7 Hari</p>
                            <div className="rounded-2xl border border-slate-200/60 bg-white p-4">
                                <PriceChart komoditas={selectedKomoditas} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-xl p-2.5 text-center bg-slate-50 border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min</p>
                                    <p className="text-[11px] font-extrabold text-emerald-700 mt-1 leading-none">Rp {Math.min(...selectedKomoditas.hariData).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="rounded-xl p-2.5 text-center bg-slate-50 border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Avg</p>
                                    <p className="text-[11px] font-extrabold text-slate-500 mt-1 leading-none">
                                        Rp {Math.round(selectedKomoditas.hariData.reduce((a, b) => a + b) / selectedKomoditas.hariData.length).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="rounded-xl p-2.5 text-center bg-slate-50 border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Max</p>
                                    <p className="text-[11px] font-extrabold text-emerald-600 mt-1 leading-none">Rp {Math.max(...selectedKomoditas.hariData).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap-style Location spread */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Persebaran Lokasi</p>
                        <div className="space-y-3">
                            {['Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara', 'Kebumen'].map((loc, i) => {
                                const count = commodities.filter(c => c.lokasi === loc).length;
                                const pct = (count / commodities.length) * 100;
                                const barColor = ['bg-emerald-500', 'bg-emerald-600', 'bg-amber-500', 'bg-cyan-500', 'bg-purple-500'][i];
                                return (
                                    <div key={loc} className="flex items-center gap-3">
                                        <span className="text-[11px] font-bold text-slate-600 w-24 leading-none">{loc}</span>
                                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct * 3.5}%` }} />
                                        </div>
                                        <span className="text-[11px] font-extrabold text-slate-800 w-4 text-right leading-none">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
