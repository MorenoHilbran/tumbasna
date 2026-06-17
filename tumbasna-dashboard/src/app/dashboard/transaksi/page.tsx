'use client';

import { useState } from 'react';
import {
    Search,
    Filter,
    Calendar,
    Download,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Wallet,
    TrendingUp,
    ShoppingCart,
    Users,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
const transaksiData = [
    { id: 'TRX-8821', buyer: 'Pasar Manis', supplier: 'UD Tani Jaya', produk: 'Beras Premium', qty: '300 kg', nilai: 4260000, status: 'selesai', tanggal: '2026-06-06', wilayah: 'Banyumas', metode: 'QRIS' },
    { id: 'TRX-8820', buyer: 'RM Sederhana', supplier: 'Kebun Hijau', produk: 'Cabai Merah', qty: '50 kg', nilai: 1925000, status: 'proses', tanggal: '2026-06-06', wilayah: 'Cilacap', metode: 'Transfer' },
    { id: 'TRX-8819', buyer: 'Swalayan Maju', supplier: 'CV Agro', produk: 'Bawang Putih', qty: '200 kg', nilai: 6500000, status: 'selesai', tanggal: '2026-06-06', wilayah: 'Banyumas', metode: 'QRIS' },
    { id: 'TRX-8818', buyer: 'Toko Barokah', supplier: 'PT Sweet', produk: 'Gula Pasir', qty: '100 kg', nilai: 1550000, status: 'batal', tanggal: '2026-06-05', wilayah: 'Kebumen', metode: 'QRIS' },
    { id: 'TRX-8817', buyer: 'Warung Pak Haji', supplier: 'Petani Cilacap', produk: 'Beras Medium', qty: '150 kg', nilai: 1725000, status: 'selesai', tanggal: '2026-06-05', wilayah: 'Cilacap', metode: 'Transfer' },
    { id: 'TRX-8816', buyer: 'Minimarket 24', supplier: 'UD Makmur', produk: 'Minyak Goreng', qty: '80 kg', nilai: 1424000, status: 'selesai', tanggal: '2026-06-05', wilayah: 'Purbalingga', metode: 'QRIS' },
    { id: 'TRX-8815', buyer: 'Hotel Bintang', supplier: 'Farm Fresh', produk: 'Tomat', qty: '40 kg', nilai: 340000, status: 'proses', tanggal: '2026-06-05', wilayah: 'Kebumen', metode: 'Transfer' },
    { id: 'TRX-8814', buyer: 'Catering Andini', supplier: 'CV Tani', produk: 'Jagung Pipil', qty: '500 kg', nilai: 3400000, status: 'selesai', tanggal: '2026-06-04', wilayah: 'Cilacap', metode: 'QRIS' },
    { id: 'TRX-8813', buyer: 'Pasar Wage', supplier: 'Kelompok Tani', produk: 'Cabai Rawit', qty: '30 kg', nilai: 1350000, status: 'selesai', tanggal: '2026-06-04', wilayah: 'Banjarnegara', metode: 'QRIS' },
    { id: 'TRX-8812', buyer: 'UMKM Tempe', supplier: 'UD Kedelai', produk: 'Kedelai', qty: '200 kg', nilai: 1960000, status: 'menunggu', tanggal: '2026-06-04', wilayah: 'Banjarnegara', metode: 'Transfer' },
    { id: 'TRX-8811', buyer: 'Resto Jogja', supplier: 'Distributor JT', produk: 'Bawang Merah', qty: '80 kg', nilai: 2240000, status: 'selesai', tanggal: '2026-06-03', wilayah: 'Banyumas', metode: 'QRIS' },
    { id: 'TRX-8810', buyer: 'Warung Makan', supplier: 'Petani Lokal', produk: 'Kentang', qty: '60 kg', nilai: 720000, status: 'batal', tanggal: '2026-06-03', wilayah: 'Purbalingga', metode: 'Transfer' },
];

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
        selesai: { bg: 'rgba(127,187,84,0.12)', color: '#5E9C36', label: 'Selesai', Icon: CheckCircle2 },
        proses: { bg: 'rgba(105,126,232,0.12)', color: '#4C5DD4', label: 'Diproses', Icon: Loader2 },
        menunggu: { bg: 'rgba(235,151,40,0.12)', color: '#C47D10', label: 'Menunggu', Icon: Clock },
        batal: { bg: 'rgba(239,68,68,0.10)', color: '#DC2626', label: 'Dibatalkan', Icon: XCircle },
    };
    const s = map[status] ?? map.menunggu;
    return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color, fontFamily: 'Poppins, sans-serif' }}>
            <s.Icon className="w-2.5 h-2.5" />
            {s.label}
        </span>
    );
}

// ─── Main Transaksi Page ──────────────────────────────────────
export default function TransaksiPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [wilayahFilter, setWilayahFilter] = useState('Semua');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTrx, setSelectedTrx] = useState<typeof transaksiData[0] | null>(null);
    const perPage = 8;

    const filtered = transaksiData.filter(t =>
        (t.id.toLowerCase().includes(search.toLowerCase()) ||
         t.buyer.toLowerCase().includes(search.toLowerCase()) ||
         t.supplier.toLowerCase().includes(search.toLowerCase()) ||
         t.produk.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === 'Semua' || t.status === statusFilter) &&
        (wilayahFilter === 'Semua' || t.wilayah === wilayahFilter)
    );

    const totalPages = Math.ceil(filtered.length / perPage);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
    const totalNilai = transaksiData.filter(t => t.status === 'selesai').reduce((a, t) => a + t.nilai, 0);

    return (
        <div className="p-6 space-y-5" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1F3826' }}>Monitoring Transaksi</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8DA88F' }}>
                        Seluruh aktivitas transaksi platform secara real-time
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#1F3826' }}>
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Transaksi', value: transaksiData.length, icon: ShoppingCart, color: '#697EE8', bg: 'rgba(105,126,232,0.08)', suffix: '' },
                    { label: 'Nilai Selesai', value: `Rp ${(totalNilai / 1000000).toFixed(1)}M`, icon: Wallet, color: '#7FBB54', bg: 'rgba(127,187,84,0.08)', suffix: '' },
                    { label: 'Transaksi Selesai', value: transaksiData.filter(t => t.status === 'selesai').length, icon: CheckCircle2, color: '#5E9C36', bg: 'rgba(127,187,84,0.08)', suffix: '' },
                    { label: 'Transaksi Batal', value: transaksiData.filter(t => t.status === 'batal').length, icon: XCircle, color: '#DC2626', bg: 'rgba(239,68,68,0.08)', suffix: '' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border card-hover" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium" style={{ color: '#8DA88F' }}>{s.label}</p>
                                <p className="text-lg font-bold" style={{ color: '#1F3826' }}>{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl" style={{ background: '#F4F7F2', border: '1px solid #DDE5D8' }}>
                        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8DA88F' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari ID, buyer, supplier, produk..."
                            className="flex-1 text-xs bg-transparent outline-none"
                            style={{ color: '#1F3826', fontFamily: 'Poppins, sans-serif' }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" style={{ color: '#8DA88F' }} />
                        {['Semua', 'selesai', 'proses', 'menunggu', 'batal'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
                                style={{
                                    background: statusFilter === s ? '#1F3826' : '#F4F7F2',
                                    color: statusFilter === s ? 'white' : '#8DA88F',
                                    fontFamily: 'Poppins, sans-serif',
                                }}
                            >
                                {s === 'Semua' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Wilayah Filter */}
                    <select
                        value={wilayahFilter}
                        onChange={e => setWilayahFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl text-xs font-medium outline-none"
                        style={{ background: '#F4F7F2', color: '#1F3826', border: '1px solid #DDE5D8', fontFamily: 'Poppins, sans-serif' }}
                    >
                        {['Semua', 'Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara', 'Kebumen'].map(w => (
                            <option key={w} value={w}>{w === 'Semua' ? 'Semua Wilayah' : w}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table + Detail */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Table */}
                <div className="xl:col-span-2 bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#DDE5D8' }}>
                        <p className="text-sm font-bold" style={{ color: '#1F3826' }}>Daftar Transaksi</p>
                        <p className="text-xs" style={{ color: '#8DA88F' }}>{filtered.length} transaksi ditemukan</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: '#F4F7F2' }}>
                                    {['ID Transaksi', 'Buyer', 'Supplier', 'Produk', 'Nilai', 'Status', 'Tanggal', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8DA88F', fontFamily: 'Poppins, sans-serif' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((t, i) => (
                                    <tr
                                        key={t.id}
                                        className="border-t cursor-pointer transition-all"
                                        style={{
                                            borderColor: '#DDE5D8',
                                            background: selectedTrx?.id === t.id ? 'rgba(127,187,84,0.06)' : i % 2 === 0 ? 'white' : '#FAFBF9',
                                        }}
                                        onClick={() => setSelectedTrx(t)}
                                    >
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-bold" style={{ color: '#697EE8', fontFamily: 'Poppins, sans-serif' }}>{t.id}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-semibold" style={{ color: '#1F3826' }}>{t.buyer}</p>
                                            <p className="text-[10px]" style={{ color: '#8DA88F' }}>{t.wilayah}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs" style={{ color: '#1F3826' }}>{t.supplier}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-semibold" style={{ color: '#1F3826' }}>{t.produk}</p>
                                            <p className="text-[10px]" style={{ color: '#8DA88F' }}>{t.qty}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs font-bold" style={{ color: '#1F3826' }}>Rp {t.nilai.toLocaleString('id')}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={t.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-[11px]" style={{ color: '#8DA88F' }}>{t.tanggal}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110" style={{ background: 'rgba(105,126,232,0.10)' }}>
                                                <Eye className="w-3.5 h-3.5" style={{ color: '#697EE8' }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#DDE5D8' }}>
                        <p className="text-[11px]" style={{ color: '#8DA88F' }}>
                            Halaman {currentPage} dari {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                                style={{ background: '#F4F7F2', color: '#1F3826' }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className="w-7 h-7 rounded-lg text-[11px] font-bold"
                                    style={{
                                        background: currentPage === p ? '#1F3826' : '#F4F7F2',
                                        color: currentPage === p ? 'white' : '#8DA88F',
                                        fontFamily: 'Poppins, sans-serif',
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40"
                                style={{ background: '#F4F7F2', color: '#1F3826' }}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    {selectedTrx ? (
                        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs font-semibold" style={{ color: '#697EE8' }}>{selectedTrx.id}</p>
                                    <h2 className="text-base font-bold mt-0.5" style={{ color: '#1F3826' }}>Detail Transaksi</h2>
                                </div>
                                <StatusBadge status={selectedTrx.status} />
                            </div>

                            {/* Nilai besar */}
                            <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1F3826 0%, #2D5038 100%)' }}>
                                <p className="text-xs font-medium mb-1" style={{ color: 'rgba(127,187,84,0.8)' }}>Nilai Transaksi</p>
                                <p className="text-2xl font-bold text-white">Rp {selectedTrx.nilai.toLocaleString('id')}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,187,84,0.2)', color: '#7FBB54' }}>
                                        via {selectedTrx.metode}
                                    </span>
                                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedTrx.tanggal}</span>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="space-y-3 mb-4">
                                {[
                                    { label: 'Buyer', value: selectedTrx.buyer, sub: selectedTrx.wilayah },
                                    { label: 'Supplier', value: selectedTrx.supplier, sub: null },
                                    { label: 'Produk', value: selectedTrx.produk, sub: selectedTrx.qty },
                                ].map(item => (
                                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#F4F7F2' }}>
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'white' }}>
                                            <Users className="w-3.5 h-3.5" style={{ color: '#7FBB54' }} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium" style={{ color: '#8DA88F' }}>{item.label}</p>
                                            <p className="text-xs font-semibold" style={{ color: '#1F3826' }}>{item.value}</p>
                                            {item.sub && <p className="text-[10px]" style={{ color: '#8DA88F' }}>{item.sub}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Timeline */}
                            <div>
                                <p className="text-xs font-semibold mb-3" style={{ color: '#1F3826' }}>Timeline Transaksi</p>
                                <div className="relative pl-4 space-y-4" style={{ borderLeft: '2px solid #DDE5D8' }}>
                                    {[
                                        { time: '08:12', label: 'Order Dibuat', done: true },
                                        { time: '08:15', label: 'Konfirmasi Supplier', done: true },
                                        { time: '09:30', label: 'Pembayaran QRIS', done: selectedTrx.status !== 'menunggu' },
                                        { time: '10:00', label: 'Proses Pengiriman', done: selectedTrx.status === 'selesai' },
                                        { time: '14:00', label: 'Transaksi Selesai', done: selectedTrx.status === 'selesai' },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-3 relative">
                                            <div
                                                className="absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white"
                                                style={{ background: step.done ? '#7FBB54' : '#DDE5D8', top: '3px' }}
                                            />
                                            <div>
                                                <p className="text-[10px]" style={{ color: '#8DA88F' }}>{step.time}</p>
                                                <p className="text-xs font-semibold" style={{ color: step.done ? '#1F3826' : '#8DA88F' }}>{step.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center" style={{ minHeight: '300px' }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#EDF2EA' }}>
                                <ShoppingCart className="w-6 h-6" style={{ color: '#7FBB54' }} />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: '#1F3826' }}>Pilih Transaksi</p>
                            <p className="text-xs mt-1" style={{ color: '#8DA88F' }}>Klik baris transaksi untuk melihat detail</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
