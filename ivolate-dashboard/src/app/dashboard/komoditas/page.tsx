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

    const color = tren === 'naik' ? '#EB9728' : tren === 'turun' ? '#697EE8' : '#8DA88F';

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ─── Price Chart ──────────────────────────────────────────────
function PriceChart({ komoditas }: { komoditas: typeof commodities[0] }) {
    const max = Math.max(...komoditas.hariData);
    const min = Math.min(...komoditas.hariData);
    const range = max - min || 1;
    const h = 120;
    const w = 100;

    const pts = komoditas.hariData.map((v, i) => {
        const x = (i / (komoditas.hariData.length - 1)) * (100);
        const y = h - ((v - min) / range) * (h - 20) - 10;
        return `${x}%,${y}`;
    }).join(' ');

    return (
        <div style={{ height: h, position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height={h} preserveAspectRatio="none" viewBox={`0 0 100 ${h}`}>
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={komoditas.tren === 'naik' ? '#EB9728' : '#697EE8'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={komoditas.tren === 'naik' ? '#EB9728' : '#697EE8'} stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <polyline
                    points={komoditas.hariData.map((v, i) => {
                        const x = (i / (komoditas.hariData.length - 1)) * 100;
                        const y = h - ((v - min) / range) * (h - 20) - 10;
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={komoditas.tren === 'naik' ? '#EB9728' : komoditas.tren === 'turun' ? '#697EE8' : '#8DA88F'}
                    strokeWidth={2}
                />
            </svg>
            {/* Day labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                {weekDays.map((d) => (
                    <span key={d} className="text-[9px]" style={{ color: '#8DA88F', fontFamily: 'Poppins, sans-serif' }}>{d}</span>
                ))}
            </div>
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────
function StockStatus({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        aman: { bg: 'rgba(127,187,84,0.12)', color: '#5E9C36', label: 'Aman' },
        waspada: { bg: 'rgba(235,151,40,0.12)', color: '#C47D10', label: 'Waspada' },
        kritis: { bg: 'rgba(239,68,68,0.10)', color: '#DC2626', label: 'Kritis' },
    };
    const s = map[status] ?? map.aman;
    return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, fontFamily: 'Poppins, sans-serif' }}>
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
        <div className="p-6 space-y-5" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1F3826' }}>Monitoring Komoditas</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8DA88F' }}>
                        Tracking harga, stok, dan titik lokasi komoditas pangan
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: '#1F3826' }}
                >
                    <Download className="w-4 h-4" />
                    Export Data
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Komoditas', value: commodities.length, color: '#697EE8', bg: 'rgba(105,126,232,0.08)', icon: Package },
                    { label: 'Status Kritis', value: commodities.filter(c => c.status === 'kritis').length, color: '#DC2626', bg: 'rgba(239,68,68,0.08)', icon: AlertTriangle },
                    { label: 'Harga Naik', value: commodities.filter(c => c.tren === 'naik').length, color: '#EB9728', bg: 'rgba(235,151,40,0.08)', icon: TrendingUp },
                    { label: 'Harga Turun', value: commodities.filter(c => c.tren === 'turun').length, color: '#7FBB54', bg: 'rgba(127,187,84,0.08)', icon: TrendingDown },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border card-hover" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                            <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <p className="text-xs font-medium" style={{ color: '#8DA88F' }}>{s.label}</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: '#1F3826' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content: Table + Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Table */}
                <div className="xl:col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    {/* Table Controls */}
                    <div className="p-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: '#DDE5D8' }}>
                        {/* Search */}
                        <div className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 rounded-xl" style={{ background: '#F4F7F2', border: '1px solid #DDE5D8' }}>
                            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8DA88F' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari komoditas..."
                                className="flex-1 text-xs bg-transparent outline-none"
                                style={{ color: '#1F3826', fontFamily: 'Poppins, sans-serif' }}
                            />
                        </div>

                        {/* Category filter */}
                        <div className="flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5" style={{ color: '#8DA88F' }} />
                            {['Semua', 'Pangan Pokok', 'Hortikultura'].map(k => (
                                <button
                                    key={k}
                                    onClick={() => setKategoriFilter(k)}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                                    style={{
                                        background: kategoriFilter === k ? '#1F3826' : '#F4F7F2',
                                        color: kategoriFilter === k ? 'white' : '#8DA88F',
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: '#F4F7F2' }}>
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
                                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                            style={{ color: '#8DA88F', fontFamily: 'Poppins, sans-serif' }}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {col.sortable && (
                                                    <button onClick={() => {
                                                        if (sortBy === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                                        else { setSortBy(col.key as any); setSortDir('desc'); }
                                                    }}>
                                                        <ArrowUpDown className="w-3 h-3" style={{ color: sortBy === col.key ? '#1F3826' : '#DDE5D8' }} />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, i) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => setSelectedKomoditas(c)}
                                        className="border-t cursor-pointer transition-all duration-150"
                                        style={{
                                            borderColor: '#DDE5D8',
                                            background: selectedKomoditas.id === c.id ? 'rgba(127,187,84,0.06)' : i % 2 === 0 ? 'white' : '#FAFBF9',
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EDF2EA' }}>
                                                    <Package className="w-3.5 h-3.5" style={{ color: '#7FBB54' }} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold" style={{ color: '#1F3826' }}>{c.nama}</p>
                                                    <p className="text-[10px]" style={{ color: '#8DA88F' }}>{c.kategori}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-bold" style={{ color: '#1F3826' }}>Rp {c.harga.toLocaleString('id')}</p>
                                            <p className="text-[10px] flex items-center gap-0.5 mt-0.5"
                                                style={{ color: c.pctChange > 0 ? '#EB9728' : c.pctChange < 0 ? '#697EE8' : '#8DA88F' }}>
                                                {c.pctChange > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : c.pctChange < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                                                {Math.abs(c.pctChange)}%
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-semibold" style={{ color: '#1F3826' }}>{c.stok.toLocaleString('id')} {c.satuan}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" style={{ color: '#8DA88F' }} />
                                                <span className="text-xs" style={{ color: '#8DA88F' }}>{c.lokasi}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Sparkline data={c.hariData} tren={c.tren} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <StockStatus status={c.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#DDE5D8' }}>
                        <p className="text-[11px]" style={{ color: '#8DA88F' }}>Menampilkan {filtered.length} dari {commodities.length} komoditas</p>
                    </div>
                </div>

                {/* Detail Chart Panel */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4" style={{ color: '#7FBB54' }} />
                        <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>Detail Komoditas</h2>
                    </div>
                    <p className="text-xs mb-4" style={{ color: '#8DA88F' }}>Klik baris tabel untuk melihat grafik</p>

                    {/* Selected commodity info */}
                    <div className="rounded-xl p-4 mb-4" style={{ background: '#F4F7F2' }}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: '#1F3826' }}>{selectedKomoditas.nama}</h3>
                                <p className="text-[11px] mt-0.5" style={{ color: '#8DA88F' }}>{selectedKomoditas.kategori} • {selectedKomoditas.lokasi}</p>
                            </div>
                            <StockStatus status={selectedKomoditas.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10px]" style={{ color: '#8DA88F' }}>Harga Saat Ini</p>
                                <p className="text-lg font-bold" style={{ color: '#1F3826' }}>Rp {selectedKomoditas.harga.toLocaleString('id')}</p>
                            </div>
                            <div>
                                <p className="text-[10px]" style={{ color: '#8DA88F' }}>Stok Tersedia</p>
                                <p className="text-lg font-bold" style={{ color: '#1F3826' }}>{selectedKomoditas.stok.toLocaleString('id')} {selectedKomoditas.satuan}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                style={{
                                    background: selectedKomoditas.pctChange > 5 ? 'rgba(235,151,40,0.12)' : selectedKomoditas.pctChange < 0 ? 'rgba(105,126,232,0.10)' : 'rgba(127,187,84,0.10)',
                                    color: selectedKomoditas.pctChange > 5 ? '#C47D10' : selectedKomoditas.pctChange < 0 ? '#4C5DD4' : '#5E9C36',
                                }}
                            >
                                {selectedKomoditas.pctChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {selectedKomoditas.pctChange > 0 ? '+' : ''}{selectedKomoditas.pctChange}% (7 hari)
                            </div>
                        </div>
                    </div>

                    {/* Price Chart */}
                    <div>
                        <p className="text-[11px] font-semibold mb-2" style={{ color: '#1F3826' }}>Grafik Harga 7 Hari</p>
                        <div className="rounded-xl overflow-hidden" style={{ background: '#F4F7F2', padding: '12px' }}>
                            <PriceChart komoditas={selectedKomoditas} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="rounded-lg p-2 text-center" style={{ background: '#F4F7F2' }}>
                                <p className="text-[9px]" style={{ color: '#8DA88F' }}>Min</p>
                                <p className="text-[11px] font-bold" style={{ color: '#697EE8' }}>Rp {Math.min(...selectedKomoditas.hariData).toLocaleString('id')}</p>
                            </div>
                            <div className="rounded-lg p-2 text-center" style={{ background: '#F4F7F2' }}>
                                <p className="text-[9px]" style={{ color: '#8DA88F' }}>Avg</p>
                                <p className="text-[11px] font-bold" style={{ color: '#8DA88F' }}>
                                    Rp {Math.round(selectedKomoditas.hariData.reduce((a, b) => a + b) / selectedKomoditas.hariData.length).toLocaleString('id')}
                                </p>
                            </div>
                            <div className="rounded-lg p-2 text-center" style={{ background: '#F4F7F2' }}>
                                <p className="text-[9px]" style={{ color: '#8DA88F' }}>Max</p>
                                <p className="text-[11px] font-bold" style={{ color: '#EB9728' }}>Rp {Math.max(...selectedKomoditas.hariData).toLocaleString('id')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap-style Location spread */}
                    <div className="mt-4">
                        <p className="text-[11px] font-semibold mb-2" style={{ color: '#1F3826' }}>Persebaran Lokasi</p>
                        <div className="space-y-1.5">
                            {['Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara', 'Kebumen'].map((loc, i) => {
                                const count = commodities.filter(c => c.lokasi === loc).length;
                                const pct = (count / commodities.length) * 100;
                                return (
                                    <div key={loc} className="flex items-center gap-2">
                                        <span className="text-[10px] w-24" style={{ color: '#8DA88F' }}>{loc}</span>
                                        <div className="flex-1 h-2 rounded-full" style={{ background: '#EDF2EA' }}>
                                            <div className="h-full rounded-full" style={{
                                                width: `${pct * 4}%`,
                                                background: ['#7FBB54', '#697EE8', '#EB9728', '#7FBB54', '#697EE8'][i],
                                            }} />
                                        </div>
                                        <span className="text-[10px] font-semibold w-4" style={{ color: '#1F3826' }}>{count}</span>
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
