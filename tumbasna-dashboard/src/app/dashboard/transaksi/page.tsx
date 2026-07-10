'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Calendar,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
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
// Transaksi data akan di-fetch dari API

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; label: string; Icon: any }> = {
        selesai: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/50', label: 'Selesai', Icon: CheckCircle2 },
        proses: { bg: 'bg-teal-50 text-teal-600 border-teal-100/50', label: 'Diproses', Icon: Loader2 },
        menunggu: { bg: 'bg-amber-50 text-amber-600 border-amber-100/50', label: 'Menunggu', Icon: Clock },
        batal: { bg: 'bg-rose-50 text-rose-600 border-rose-100/50', label: 'Batal', Icon: XCircle },
    };
    const s = map[status] ?? map.menunggu;
    const Icon = s.Icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.bg}`}>
            <Icon className={`w-3 h-3 ${status === 'proses' ? 'animate-spin' : ''}`} />
            {s.label}
        </span>
    );
}

const locationCoords: Record<string, [number, number]> = {
    'Banyumas': [-7.5151, 109.2941],
    'Cilacap': [-7.7150, 108.9767],
    'Purbalingga': [-7.3884, 109.3641],
    'Banjarnegara': [-7.3884, 109.6939],
    'Kebumen': [-7.6701, 109.6524]
};

export default function TransaksiPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [wilayahFilter, setWilayahFilter] = useState('Semua');
    const [currentPage, setCurrentPage] = useState(1);
    const [transaksiData, setTransaksiData] = useState<any[]>([]);
    const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
    const [shippingOptions, setShippingOptions] = useState<any[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [waybillNumber, setWaybillNumber] = useState('');
    const [waybillCourier, setWaybillCourier] = useState('jne');
    const [showWaybillForm, setShowWaybillForm] = useState(false);
    const perPage = 8;

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        setIsLoading(true);
        fetch('/api/orders')
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    const mapped = json.data.map((o: any) => {
                        let statusUI = 'menunggu';
                        if (o.status === 'SELESAI') statusUI = 'selesai';
                        if (o.status === 'DIPROSES' || o.status === 'DIKIRIM') statusUI = 'proses';
                        if (o.status === 'DIBATALKAN') statusUI = 'batal';

                        return {
                            id: o.id,
                            buyer: o.items?.[0]?.product?.name ? 'Toko ' + o.supplierName.split(' ')[0] : 'Toko Tani',
                            supplier: o.supplierName,
                            produk: o.items?.[0]?.product?.name || 'Komoditas',
                            qty: (o.items?.[0]?.quantity || 100) + ' kg',
                            nilai: o.totalAmount,
                            status: statusUI,
                            tanggal: o.date,
                            wilayah: o.supplierLocation.split(',')[0] || 'Cilacap',
                            metode: 'QRIS',
                            dbStatus: o.status,
                            trackingTimeline: o.trackingTimeline || [],
                            rawNotes: o.notes || null,
                        };
                    });
                    setTransaksiData(mapped);
                    if (mapped.length > 0) setSelectedTrx(mapped[0]);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const body: any = { status: newStatus };
            
            // Jika admin klik "Kirim Barang", sertakan nomor resi dan update timeline
            if (newStatus === 'DIKIRIM' && selectedTrx) {
                if (!waybillNumber.trim()) {
                    alert('Masukkan nomor resi ekspedisi terlebih dahulu!');
                    return;
                }
                body.waybillNumber = waybillNumber.trim();
                body.waybillCourier = waybillCourier;

                const updatedTimeline = [...(selectedTrx.trackingTimeline || [])];
                const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                if (updatedTimeline.length >= 4) {
                    updatedTimeline[2] = { ...updatedTimeline[2], done: true, time: currentTime };
                    updatedTimeline[3] = { ...updatedTimeline[3], time: 'Sedang Berjalan', description: `Barang dijemput kurir ${waybillCourier.toUpperCase()}. Nomor resi: ${waybillNumber.trim()}` };
                    body.trackingTimeline = updatedTimeline;
                }
            }

            const res = await fetch(`/api/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (res.ok) {
                setShowWaybillForm(false);
                setWaybillNumber('');
                fetchOrders();
                alert(`Status transaksi ${id} berhasil diubah menjadi ${newStatus}`);
            }
        } catch (e) {
            console.error('Gagal update status:', e);
        }
    };

    useEffect(() => {
        if (!selectedTrx) return;
        
        let originKey = 'Cilacap';
        if (selectedTrx.supplier.includes('Agro') || selectedTrx.supplier.includes('Sweet')) {
            originKey = 'Purbalingga';
        } else if (selectedTrx.supplier.includes('Tani') || selectedTrx.supplier.includes('Tani Jaya')) {
            originKey = 'Kebumen';
        } else if (selectedTrx.supplier.includes('Petani Lokal') || selectedTrx.supplier.includes('Kedelai')) {
            originKey = 'Banjarnegara';
        }
        
        const origin = locationCoords[originKey] || [-7.7150, 108.9767];
        const dest = locationCoords[selectedTrx.wilayah] || [-7.5151, 109.2941];
        
        const qtyNum = parseInt(selectedTrx.qty) || 100;
        const weightGram = qtyNum * 1000;
        
        setShippingLoading(true);
        fetch('/api/logistik/ongkir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originLat: origin[0],
                originLng: origin[1],
                destinationLat: dest[0],
                destinationLng: dest[1],
                weightGram
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.options) {
                setShippingOptions(data.options);
                const recommended = data.options.find((o: any) => o.isRecommended) || data.options[0];
                setSelectedShipping(recommended);
            }
        })
        .catch(err => console.error('Gagal mengambil ongkir:', err))
        .finally(() => setShippingLoading(false));

    }, [selectedTrx]);

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
        <div className="p-4 md:p-8 space-y-8 bg-[#F8FAFC]">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Monitoring Transaksi</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Seluruh aktivitas transaksi platform secara real-time
                    </p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-xs rounded-xl shadow-sm self-start md:self-auto">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Export Transaksi
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Transaksi', value: transaksiData.length, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50/70' },
                    { label: 'Nilai Selesai', value: `Rp ${(totalNilai / 1000000).toFixed(1)} jt`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50/70' },
                    { label: 'Transaksi Selesai', value: transaksiData.filter(t => t.status === 'selesai').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/70' },
                    { label: 'Transaksi Batal', value: transaksiData.filter(t => t.status === 'batal').length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50/70' },
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

            {/* Filters */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 w-full sm:w-80 transition-all">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari ID, buyer, supplier, produk..."
                            className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400 font-semibold"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                                <Filter className="w-3.5 h-3.5 text-emerald-500" />
                                Status:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/40">
                                {['Semua', 'selesai', 'proses', 'menunggu', 'batal'].map(s => {
                                    const isAct = statusFilter === s;
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize ${
                                                isAct 
                                                    ? 'bg-white text-slate-800 shadow-sm' 
                                                    : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                        >
                                            {s === 'Semua' ? 'Semua' : s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Wilayah Filter */}
                        <div className="flex items-center gap-1.5">
                            <select
                                value={wilayahFilter}
                                onChange={e => setWilayahFilter(e.target.value)}
                                className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all cursor-pointer"
                            >
                                {['Semua', 'Banyumas', 'Cilacap', 'Purbalingga', 'Banjarnegara', 'Kebumen'].map(w => (
                                    <option key={w} value={w}>{w === 'Semua' ? 'Semua Wilayah' : w}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table + Detail */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Table */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Daftar Transaksi</h2>
                            <p className="text-xs text-slate-400 font-semibold">{filtered.length} transaksi ditemukan</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['ID Transaksi', 'Buyer', 'Supplier', 'Produk', 'Nilai', 'Status', 'Tanggal', ''].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginated.map((t) => {
                                        const isSelected = selectedTrx?.id === t.id;
                                        return (
                                            <tr
                                                key={t.id}
                                                className={`cursor-pointer transition-all duration-150 ${
                                                    isSelected 
                                                        ? 'bg-emerald-50/20 border-l-2 border-l-emerald-600' 
                                                        : 'hover:bg-slate-50/50 border-l-2 border-l-transparent'
                                                }`}
                                                onClick={() => setSelectedTrx(t)}
                                            >
                                                <td className="px-5 py-3">
                                                    <span className="text-xs font-bold text-emerald-600 font-mono">{t.id}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-xs font-bold text-slate-800">{t.buyer}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">{t.wilayah}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-xs font-semibold text-slate-700">{t.supplier}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-xs font-bold text-slate-850">{t.produk}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">{t.qty}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-xs font-extrabold text-slate-800">Rp {t.nilai.toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <StatusBadge status={t.status} />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <p className="text-[11px] text-slate-400 font-bold">{t.tanggal}</p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Halaman {currentPage} dari {totalPages || 1}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all border ${
                                        currentPage === p 
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    {selectedTrx ? (
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600 font-mono tracking-wide">{selectedTrx.id}</p>
                                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">Detail Transaksi</h2>
                                    </div>
                                    <StatusBadge status={selectedTrx.status} />
                                </div>

                                {/* Nilai besar */}
                                <div className="rounded-2xl p-5 mb-5 bg-slate-900 border border-slate-800 text-white space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Harga Barang</span>
                                        <span className="text-white font-extrabold">Rp {selectedTrx.nilai.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Ongkos Kirim</span>
                                        <span className="text-white font-extrabold">
                                            {selectedShipping ? `Rp ${selectedShipping.cost.toLocaleString('id-ID')}` : 'Rp 0'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-800/80 my-2" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Tagihan</p>
                                        <p className="text-2xl font-extrabold text-white mt-1.5 leading-none">
                                            Rp {(selectedTrx.nilai + (selectedShipping ? selectedShipping.cost : 0)).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                                        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700/50">
                                            via {selectedTrx.metode}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold ml-auto">{selectedTrx.tanggal}</span>
                                    </div>
                                </div>

                                {/* Info grid */}
                                <div className="space-y-3 mb-5">
                                    {[
                                        { label: 'Buyer', value: selectedTrx.buyer, sub: selectedTrx.wilayah },
                                        { label: 'Supplier', value: selectedTrx.supplier, sub: null },
                                        { label: 'Produk', value: selectedTrx.produk, sub: selectedTrx.qty },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-slate-200/30 text-emerald-500 shadow-sm">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                                <p className="text-xs font-bold text-slate-800 mt-1">{item.value}</p>
                                                {item.sub && <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">{item.sub}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Opsi Pengiriman & Rekomendasi Ongkir */}
                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pilihan Pengiriman & Ongkir</p>
                                    {shippingLoading ? (
                                        <div className="flex items-center justify-center py-6 gap-2">
                                            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                                            <span className="text-xs text-slate-400 font-bold">Menganalisis rute terhemat...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {shippingOptions.map((opt: any) => {
                                                const isSel = selectedShipping?.id === opt.id;
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        onClick={() => setSelectedShipping(opt)}
                                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                            isSel
                                                                ? 'border-emerald-600 bg-emerald-50/20'
                                                                : 'border-slate-200/60 bg-white hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-800">{opt.name}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold ml-2">({opt.eta})</span>
                                                            </div>
                                                            <span className="text-xs font-extrabold text-slate-900">
                                                                Rp {opt.cost.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-450 mt-1 font-medium leading-tight">{opt.description}</p>
                                                        {opt.isRecommended && (
                                                            <div className="mt-2 text-[9px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200/50 px-2.5 py-1 rounded-lg">
                                                                {opt.recommendationReason}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Timeline Transaksi</p>
                                <div className="relative pl-4 space-y-4 border-l border-dashed border-slate-200">
                                    {[
                                        { time: '08:12', label: 'Order Dibuat', done: true },
                                        { time: '08:15', label: 'Konfirmasi Supplier', done: true },
                                        { time: '09:30', label: 'Pembayaran Diterima', done: selectedTrx.status !== 'menunggu' },
                                        { time: '10:00', label: 'Proses Pengiriman', done: selectedTrx.status === 'selesai' },
                                        { time: '14:00', label: 'Transaksi Selesai', done: selectedTrx.status === 'selesai' },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-3 relative">
                                            <div
                                                className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ${
                                                    step.done 
                                                        ? 'bg-emerald-500 ring-emerald-50' 
                                                        : 'bg-slate-200 ring-transparent'
                                                }`}
                                                style={{ top: '3px' }}
                                            />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 leading-none">{step.time}</p>
                                                <p className={`text-xs font-bold mt-1 leading-none ${
                                                    step.done ? 'text-slate-800' : 'text-slate-450'
                                                }`}>{step.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Action Button - Input Resi */}
                            {selectedTrx.dbStatus === 'DIPROSES' && (
                                <div className="mt-6 space-y-3">
                                    {!showWaybillForm ? (
                                        <button
                                            onClick={() => setShowWaybillForm(true)}
                                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Kirim Barang — Input Nomor Resi
                                        </button>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Input Resi Ekspedisi</p>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kurir</label>
                                                <select
                                                    value={waybillCourier}
                                                    onChange={e => setWaybillCourier(e.target.value)}
                                                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
                                                >
                                                    <option value="jne">JNE</option>
                                                    <option value="tiki">TIKI</option>
                                                    <option value="pos">POS Indonesia</option>
                                                    <option value="jnt">J&T Express</option>
                                                    <option value="sicepat">SiCepat</option>
                                                    <option value="anteraja">AnterAja</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nomor Resi</label>
                                                <input
                                                    type="text"
                                                    value={waybillNumber}
                                                    onChange={e => setWaybillNumber(e.target.value)}
                                                    placeholder="Contoh: JNE0012345678"
                                                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none placeholder-slate-300"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setShowWaybillForm(false); setWaybillNumber(''); }}
                                                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedTrx.id, 'DIKIRIM')}
                                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Konfirmasi Kirim
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedTrx.dbStatus === 'DIKIRIM' && (() => {
                                let notesObj: any = {};
                                try { notesObj = JSON.parse(selectedTrx.rawNotes || '{}'); } catch {}
                                return (
                                    <div className="mt-6 space-y-3">
                                        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-3">
                                            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Bukti Pengiriman</p>
                                            {notesObj.waybillNumber && (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nomor Resi</p>
                                                        <p className="text-xs font-extrabold text-slate-800 font-mono mt-0.5">{notesObj.waybillNumber}</p>
                                                        {notesObj.waybillCourier && (
                                                            <p className="text-[9px] text-teal-600 font-bold mt-0.5 uppercase">{notesObj.waybillCourier}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {notesObj.waybillImageUrl ? (
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Foto Bukti Resi</p>
                                                    <img
                                                        src={notesObj.waybillImageUrl}
                                                        alt="Foto Bukti Resi"
                                                        className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 font-medium">Foto bukti resi belum tersedia. Supplier belum mengirimkan foto resi.</p>
                                            )}
                                        </div>
                                        <div className="text-center text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 py-2.5 rounded-xl">
                                            Menunggu Konfirmasi Penerimaan dari Pembeli
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-slate-50 border border-slate-100 text-slate-400 shadow-inner">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Pilih Transaksi</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto font-medium">Klik salah satu baris transaksi untuk melihat detail lengkap</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
