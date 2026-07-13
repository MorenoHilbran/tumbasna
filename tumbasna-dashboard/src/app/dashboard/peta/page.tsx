'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import {
    MapPin,
    Package,
    Users,
    TrendingUp,
    Info,
    BarChart3,
    Layers,
    AlertTriangle,
    CheckCircle2,
    Activity,
    X,
    ShoppingCart,
    Clock,
    DollarSign,
} from 'lucide-react';

// --- Wilayah Data -----------------------------------------------------------
const wilayahData = [
    {
        id: 'banyumas',
        name: 'Banyumas',
        status: 'melimpah',
        supplier: 89,
        buyer: 234,
        komoditas: ['Beras', 'Jagung', 'Kedelai', 'Cabai Merah', 'Bawang Merah'],
        stok: '3.240 ton',
        hargaRataRata: 'Rp 12.800/kg',
        transaksi: 412,
        lat: -7.5151,
        lng: 109.2941,
        luas: 1327,
        radius: 18000,
    },
    {
        id: 'purbalingga',
        name: 'Purbalingga',
        status: 'melimpah',
        supplier: 62,
        buyer: 178,
        komoditas: ['Beras', 'Kopi', 'Tembakau', 'Singkong', 'Ubi Jalar'],
        stok: '1.870 ton',
        hargaRataRata: 'Rp 11.500/kg',
        transaksi: 287,
        lat: -7.3884,
        lng: 109.3641,
        luas: 778,
        radius: 13000,
    },
    {
        id: 'banjarnegara',
        name: 'Banjarnegara',
        status: 'menipis',
        supplier: 41,
        buyer: 143,
        komoditas: ['Sayuran', 'Kentang', 'Wortel', 'Kol'],
        stok: '620 ton',
        hargaRataRata: 'Rp 14.200/kg',
        transaksi: 98,
        lat: -7.3884,
        lng: 109.6939,
        luas: 1069,
        radius: 15000,
    },
    {
        id: 'cilacap',
        name: 'Cilacap',
        status: 'melimpah',
        supplier: 104,
        buyer: 312,
        komoditas: ['Beras', 'Ikan', 'Kelapa', 'Udang', 'Garam'],
        stok: '4.120 ton',
        hargaRataRata: 'Rp 10.900/kg',
        transaksi: 568,
        lat: -7.7150,
        lng: 108.9767,
        luas: 2138,
        radius: 22000,
    },
    {
        id: 'kebumen',
        name: 'Kebumen',
        status: 'menipis',
        supplier: 52,
        buyer: 167,
        komoditas: ['Beras', 'Gula', 'Cabai', 'Tomat'],
        stok: '780 ton',
        hargaRataRata: 'Rp 13.400/kg',
        transaksi: 120,
        lat: -7.6701,
        lng: 109.6524,
        luas: 1281,
        radius: 16000,
    },
    {
        id: 'tegal',
        name: 'Tegal',
        status: 'melimpah',
        supplier: 48,
        buyer: 125,
        komoditas: ['Beras', 'Cabai Rawit', 'Bawang Merah', 'Sayuran'],
        stok: '1.920 ton',
        hargaRataRata: 'Rp 12.000/kg',
        transaksi: 195,
        lat: -6.8676,
        lng: 109.1384,
        luas: 701,
        radius: 12000,
    },
];

// --- Dynamic Leaflet Map (client-only) ------------------------------------
const LeafletPetaMap = dynamic(() => import('@/components/PetaMapLeaflet'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-r border-slate-200/65">
            <Activity className="w-6 h-6 animate-spin mb-3 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-400">Memuat peta interaktif...</p>
        </div>
    ),
});

// --- Status Badge ----------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; label: string; Icon: any }> = {
        SELESAI: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/50', label: 'Selesai', Icon: CheckCircle2 },
        DIPROSES: { bg: 'bg-teal-50 text-teal-600 border-teal-100/50', label: 'Diproses', Icon: Activity },
        DIKIRIM: { bg: 'bg-blue-50 text-blue-600 border-blue-100/50', label: 'Dikirim', Icon: Package },
        MENUNGGU: { bg: 'bg-amber-50 text-amber-600 border-amber-100/50', label: 'Menunggu', Icon: Clock },
        DIBATALKAN: { bg: 'bg-rose-50 text-rose-600 border-rose-100/50', label: 'Batal', Icon: X },
    };
    const s = map[status] ?? map.MENUNGGU;
    const Icon = s.Icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg}`}>
            <Icon className="w-2.5 h-2.5" />
            {s.label}
        </span>
    );
}

// --- Detail Panel ----------------------------------------------------------
function DetailPanel({ w, transactions, onClose }: { w: typeof wilayahData[0]; transactions: any[]; onClose: () => void }) {
    const isMelimpah = w.status === 'melimpah';
    
    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* Header */}
            <div className={`p-4 rounded-xl mb-4 border ${isMelimpah ? 'bg-emerald-50/70 border-emerald-100/50' : 'bg-rose-50/70 border-rose-100/50'
                }`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isMelimpah ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isMelimpah ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Stok {w.status}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{w.name}</h3>
                <p className="text-[10px] text-slate-500 font-semibold">Luas: {w.luas.toLocaleString('id-ID')} km²</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Supplier</p>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{w.supplier}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Buyer</p>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{w.buyer}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-amber-600" />
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Total Stok</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-900">{w.stok}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-100/50">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <p className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Transaksi</p>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900">{w.transaksi}</p>
                </div>
            </div>

            {/* Rata-rata Harga */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-500" />
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Harga Rata-rata</p>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900">{w.hargaRataRata}</p>
                </div>
            </div>

            {/* Komoditas */}
            <div className="mb-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Komoditas Tersedia
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {w.komoditas.map((k, i) => (
                        <span
                            key={i}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                        >
                            {k}
                        </span>
                    ))}
                </div>
            </div>

            {/* Transaksi Log */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <ShoppingCart className="w-4 h-4 text-slate-500" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Detail Transaksi QRIS</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                                <ShoppingCart className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-xs font-semibold text-slate-500">Belum ada transaksi</p>
                            <p className="text-[10px] text-slate-400 mt-1">di wilayah ini</p>
                        </div>
                    ) : (
                        transactions.map((trx) => (
                            <div key={trx.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{trx.produk}</p>
                                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                            {trx.supplier} ? {trx.buyer}
                                        </p>
                                    </div>
                                    <StatusBadge status={trx.dbStatus} />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 pt-2 border-t border-slate-200/50">
                                    <div className="flex items-center gap-1">
                                        <Package className="w-3 h-3 text-slate-400" />
                                        <span>{trx.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <DollarSign className="w-3 h-3" />
                                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.nilai)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[8px] text-slate-400 font-medium mt-1.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---------------------------------------------------
export default function PetaPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [points, setPoints] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const regions = wilayahData;
    const selectedData = selected ? regions.find((r) => r.id === selected) : null;
    const melimpahCount = regions.filter((r) => r.status === 'melimpah').length;
    const menipisCount = regions.filter((r) => r.status === 'menipis').length;

    // Fetch data from API
    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard').then(res => res.json()),
            fetch('/api/orders').then(res => res.json())
        ])
        .then(([dashboardData, ordersData]) => {
            if (dashboardData.success && dashboardData.data.points) {
                setPoints(dashboardData.data.points);
            }
            
            if (ordersData.success) {
                const mapped = ordersData.data.map((o: any) => ({
                    id: o.id,
                    buyer: o.buyerName || 'Pedagang Tumbasna',
                    supplier: o.supplierName,
                    produk: o.items?.[0]?.product?.name || 'Komoditas',
                    qty: (o.items?.[0]?.quantity || 100) + ' kg',
                    nilai: o.totalAmount,
                    dbStatus: o.status,
                    tanggal: o.date,
                    wilayah: o.supplierLocation.split(',')[0]?.trim() || 'Cilacap',
                }));
                setAllTransactions(mapped);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            setLoading(false);
        });
    }, []);

    // Filter transactions by selected region
    const filteredTransactions = selectedData 
        ? allTransactions.filter(trx => 
            trx.wilayah.toLowerCase().includes(selectedData.name.toLowerCase())
        )
        : [];

    return (
        <div className="relative w-full h-full">
            {/* Map Container */}
            <div className="absolute inset-0">
                <LeafletPetaMap
                    wilayahData={regions}
                    selected={selected}
                    onSelect={setSelected}
                    productPoints={points}
                />
            </div>

            {/* FLOATING: Page Title & Legend (Top Left Overlay) */}
            <div className="absolute top-4 left-4 z-10 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-4 hidden md:block">
                <div>
                    <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">Zona QRIS</h1>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Sebaran transaksi wilayah Barlingmascakeb</p>
                </div>

                <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                        <CheckCircle2 className="w-3 h-3" />
                        {melimpahCount} Melimpah
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100/50">
                        <AlertTriangle className="w-3 h-3" />
                        {menipisCount} Menipis
                    </div>
                </div>

                {/* Legends */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Legenda</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 pt-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/30" />
                            <span>Stok Melimpah</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-500/30" />
                            <span>Stok Menipis</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING: Detail Panel (Top Right Overlay) */}
            {selectedData && (
                <div className="absolute top-4 right-4 z-10 w-90 md:w-96 max-h-[calc(100%-150px)] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg p-5">
                    <DetailPanel w={selectedData} transactions={filteredTransactions} onClose={() => setSelected(null)} />
                </div>
            )}

            {/* FLOATING: Quick Region Selector (Bottom Overlay) */}
            <div className="absolute bottom-6 left-4 right-4 md:left-4 md:right-auto z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-3 overflow-x-auto flex items-center gap-2 max-w-full md:max-w-[calc(100%-416px)] scrollbar-thin">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 whitespace-nowrap flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    Pilih Wilayah:
                </span>

                <div className="flex items-center gap-1.5">
                    {regions.map((w) => {
                        const isSel = selected === w.id;
                        return (
                            <button
                                key={w.id}
                                onClick={() => setSelected(w.id)}
                                className={`flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all duration-150 border whitespace-nowrap ${isSel
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'melimpah' ? (isSel ? 'bg-white' : 'bg-emerald-500') : (isSel ? 'bg-white' : 'bg-rose-500')
                                    }`} />
                                <span className="text-xs font-bold">{w.name}</span>
                                <span className={`text-[9px] font-medium opacity-70 ${isSel ? 'text-white' : 'text-slate-400'}`}>{w.stok}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
