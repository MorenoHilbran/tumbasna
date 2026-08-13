'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
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
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

// --- Wilayah Data -----------------------------------------------------------
// --- Wilayah Data (Base structure, stats updated via real DB API) ----------------
const baseWilayahData = [
    {
        id: 'banyumas',
        name: 'Banyumas',
        status: 'tinggi',
        supplier: 0,
        buyer: 0,
        komoditas: ['Beras IR64', 'Getuk Goreng', 'Gula Merah', 'Cabai Merah'],
        stok: '0 ton',
        hargaRataRata: 'Rp 12.800/kg',
        transaksi: 0,
        lat: -7.5151,
        lng: 109.2941,
        luas: 1327,
        radius: 18000,
    },
    {
        id: 'purbalingga',
        name: 'Purbalingga',
        status: 'tinggi',
        supplier: 4,
        buyer: 3,
        komoditas: ['Beras Pandan Wangi', 'Cabai Rawit Merah', 'Nanas Madu', 'Duku Padamara'],
        stok: '5.6 ton',
        hargaRataRata: 'Rp 15.500/kg',
        transaksi: 4,
        lat: -7.3884,
        lng: 109.3641,
        luas: 778,
        radius: 13000,
    },
    {
        id: 'banjarnegara',
        name: 'Banjarnegara',
        status: 'rendah',
        supplier: 0,
        buyer: 0,
        komoditas: ['Salak Pondoh', 'Kopi Arabika Dieng', 'Kentang Super'],
        stok: '0 ton',
        hargaRataRata: 'Rp 14.200/kg',
        transaksi: 0,
        lat: -7.3884,
        lng: 109.6939,
        luas: 1069,
        radius: 15000,
    },
    {
        id: 'cilacap',
        name: 'Cilacap',
        status: 'tinggi',
        supplier: 0,
        buyer: 0,
        komoditas: ['Ikan Tenggiri', 'Udang Rebon', 'Beras Sidareja', 'Kelapa'],
        stok: '0 ton',
        hargaRataRata: 'Rp 10.900/kg',
        transaksi: 0,
        lat: -7.7150,
        lng: 108.9767,
        luas: 2138,
        radius: 22000,
    },
    {
        id: 'kebumen',
        name: 'Kebumen',
        status: 'rendah',
        supplier: 0,
        buyer: 0,
        komoditas: ['Beras', 'Gula Kelapa', 'Cabai Rawit', 'Tomat'],
        stok: '0 ton',
        hargaRataRata: 'Rp 13.400/kg',
        transaksi: 0,
        lat: -7.6701,
        lng: 109.6524,
        luas: 1281,
        radius: 16000,
    },
    {
        id: 'tegal',
        name: 'Tegal',
        status: 'tinggi',
        supplier: 0,
        buyer: 0,
        komoditas: ['Bawang Merah', 'Teh Slawi', 'Cabai Rawit'],
        stok: '0 ton',
        hargaRataRata: 'Rp 26.000/kg',
        transaksi: 0,
        lat: -6.8676,
        lng: 109.1384,
        luas: 879,
        radius: 14000,
    },
    {
        id: 'pemalang',
        name: 'Pemalang',
        status: 'tinggi',
        supplier: 0,
        buyer: 0,
        komoditas: ['Nanas Madu Belik', 'Beras Premium'],
        stok: '0 ton',
        hargaRataRata: 'Rp 12.000/kg',
        transaksi: 0,
        lat: -6.8900,
        lng: 109.3800,
        luas: 1115,
        radius: 15000,
    },
    {
        id: 'brebes',
        name: 'Brebes',
        status: 'tinggi',
        supplier: 0,
        buyer: 0,
        komoditas: ['Bawang Merah Super', 'Telur Asin'],
        stok: '0 ton',
        hargaRataRata: 'Rp 28.500/kg',
        transaksi: 0,
        lat: -6.8700,
        lng: 108.9800,
        luas: 1662,
        radius: 17000,
    },
];

// --- Dynamic Leaflet Map (client-only) ------------------------------------
const LeafletPetaMap = dynamic(() => import('@/components/PetaMapLeaflet'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[350px] relative bg-slate-100/70 rounded-2xl overflow-hidden animate-pulse flex flex-col items-center justify-center border border-slate-200/50">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
            <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                <div className="w-8 h-8 rounded-lg bg-slate-200/80 shadow-sm" />
                <div className="w-8 h-8 rounded-lg bg-slate-200/80 shadow-sm" />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-3 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Peta...</span>
            </div>
        </div>
    ),
});

// --- Status Badge ----------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
    const st = (status || '').toUpperCase().replace(/\s+/g, '_');
    
    let key = 'MENUNGGU';
    if (st.includes('SELESAI') || st === 'SUCCESS') key = 'SELESAI';
    else if (st.includes('PROSES') || st === 'DIPROSES') key = 'DIPROSES';
    else if (st.includes('KIRIM') || st === 'DIKIRIM') key = 'DIKIRIM';
    else if (st.includes('BATAL') || st === 'DIBATALKAN') key = 'DIBATALKAN';
    else key = 'MENUNGGU';

    const map: Record<string, { bg: string; label: string; Icon: any }> = {
        SELESAI: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/50', label: 'Selesai', Icon: CheckCircle2 },
        DIPROSES: { bg: 'bg-teal-50 text-teal-600 border-teal-100/50', label: 'Diproses (Escrow)', Icon: Activity },
        DIKIRIM: { bg: 'bg-blue-50 text-blue-600 border-blue-100/50', label: 'Dikirim', Icon: Package },
        MENUNGGU: { bg: 'bg-amber-50 text-amber-600 border-amber-100/50', label: 'Menunggu', Icon: Clock },
        DIBATALKAN: { bg: 'bg-rose-50 text-rose-600 border-rose-100/50', label: 'Batal', Icon: X },
    };
    const s = map[key];
    const Icon = s.Icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.bg}`}>
            <Icon className="w-2.5 h-2.5" />
            {s.label}
        </span>
    );
}

// --- Detail Panel ----------------------------------------------------------
function DetailPanel({ w, transactions, onClose }: { w: typeof baseWilayahData[0]; transactions: any[]; onClose: () => void }) {
    const hasData = w.supplier > 0 || w.buyer > 0 || w.transaksi > 0;
    const isTinggi = w.status === 'tinggi' || w.status === 'melimpah';

    let headerBg = 'bg-slate-100/90 border-slate-200';
    let dotColor = 'bg-slate-400';
    let textColor = 'text-slate-600';
    let statusText = 'Belum Ada Data Transaksi';

    if (hasData) {
        if (isTinggi) {
            headerBg = 'bg-emerald-50/70 border-emerald-100/50';
            dotColor = 'bg-emerald-500';
            textColor = 'text-emerald-600';
            statusText = 'Transaksi Tinggi';
        } else {
            headerBg = 'bg-rose-50/70 border-rose-100/50';
            dotColor = 'bg-rose-500';
            textColor = 'text-rose-600';
            statusText = 'Transaksi Rendah';
        }
    }
    
    return (
        <div className="flex flex-col text-slate-800">
            {/* Header */}
            <div className={`p-3 rounded-xl mb-3 border ${headerBg}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${textColor}`}>
                            {statusText}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-lg transition-colors cursor-pointer">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-0.5">{w.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium">Luas Wilayah: {w.luas.toLocaleString('id-ID')} km²</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/50">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">Data Supplier</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-900">{w.supplier}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/50 border border-blue-100/50">
                    <div className="flex items-center gap-1.5 mb-1">
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-[8px] font-bold text-blue-600 uppercase tracking-wider">Data Buyer</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-900">{w.buyer}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/50">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <p className="text-[8px] font-bold text-amber-600 uppercase tracking-wider">Volume Stok</p>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900">{w.stok}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-100/50">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                        <p className="text-[8px] font-bold text-purple-600 uppercase tracking-wider">Aktivitas QRIS</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-900">{w.transaksi}</p>
                </div>
            </div>

            {/* Rata-rata Harga */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Rata-rata Harga</p>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900">{w.hargaRataRata}</p>
                </div>
            </div>

            {/* Komoditas */}
            {w.komoditas.length > 0 && (
                <div className="mb-3">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Komoditas Utama Wilayah
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {w.komoditas.map((k, i) => (
                            <span
                                key={i}
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                            >
                                {k}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Transaksi Log */}
            <div className="flex flex-col pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2 pb-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Detail Transaksi Real QRIS</p>
                </div>
                <div className="space-y-1.5">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-1.5">
                                <ShoppingCart className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-xs font-semibold text-slate-500">Belum ada transaksi real</p>
                            <p className="text-[10px] text-slate-400">di wilayah ini</p>
                        </div>
                    ) : (
                        transactions.map((trx) => (
                            <div key={trx.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{trx.produk}</p>
                                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                            {trx.supplier} &rarr; {trx.buyer}
                                        </p>
                                    </div>
                                    <StatusBadge status={trx.dbStatus} />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 pt-1.5 border-t border-slate-200/50">
                                    <div className="flex items-center gap-1">
                                        <Package className="w-3 h-3 text-slate-400" />
                                        <span>{trx.qty}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-emerald-600 font-bold">
                                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(trx.nilai)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[8px] text-slate-400 font-medium mt-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{(() => {
                                        const val = trx.tanggal;
                                        if (!val) return 'Terbaru';
                                        if (typeof val === 'string' && (val.includes('Jan') || val.includes('Feb') || val.includes('Mar') || val.includes('Apr') || val.includes('Mei') || val.includes('Jun') || val.includes('Jul') || val.includes('Agu') || val.includes('Sep') || val.includes('Okt') || val.includes('Nov') || val.includes('Des'))) {
                                            return val;
                                        }
                                        const d = new Date(val);
                                        if (isNaN(d.getTime())) return String(val);
                                        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    })()}</span>
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
    const [regions, setRegions] = useState(baseWilayahData);
    const [loading, setLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);

    // Display all 8 regions fixed on the map (Banyumas, Purbalingga, Banjarnegara, Cilacap, Kebumen, Tegal, Pemalang, Brebes)
    const displayRegions = useMemo(() => regions, [regions]);

    const selectedData = selected ? displayRegions.find((r) => r.id.toLowerCase() === selected.toLowerCase()) : null;
    const tinggiCount = displayRegions.filter((r) => (r.supplier > 0 || r.buyer > 0 || r.transaksi > 0) && (r.status === 'tinggi' || r.status === 'melimpah')).length;
    const rendahCount = displayRegions.filter((r) => (r.supplier > 0 || r.buyer > 0 || r.transaksi > 0) && (r.status === 'rendah' || r.status === 'menipis')).length;
    const kosongCount = displayRegions.filter((r) => r.supplier === 0 && r.buyer === 0 && r.transaksi === 0).length;

    // Fetch real data from API
    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard').then(res => res.json()),
            fetch('/api/orders').then(res => res.json())
        ])
        .then(([dashboardData, ordersData]) => {
            if (dashboardData.success) {
                if (dashboardData.data.points) {
                    setPoints(dashboardData.data.points);
                }
                
                // Merge real region stats from API into regions list
                if (dashboardData.data.regionStats) {
                    const statsMap = dashboardData.data.regionStats;
                    setRegions(prev => prev.map(r => {
                        const s = statsMap[r.id];
                        if (s) {
                            return {
                                ...r,
                                status: s.status || r.status,
                                supplier: s.supplier ?? r.supplier,
                                buyer: s.buyer ?? r.buyer,
                                stok: s.stok ?? r.stok,
                                hargaRataRata: s.hargaRataRata ?? r.hargaRataRata,
                                transaksi: s.transaksi ?? r.transaksi,
                                komoditas: s.komoditas && s.komoditas.length > 0 ? s.komoditas : r.komoditas
                            };
                        }
                        return r;
                    }));
                }
            }
            
            if (ordersData.success) {
                const mapped = ordersData.data.map((o: any) => ({
                    id: o.id,
                    buyer: o.buyerName || o.buyerAddress || 'Pedagang Tumbasna',
                    supplier: o.supplierName || 'Petani Tumbasna',
                    produk: o.items?.[0]?.product?.name || o.items?.[0]?.name || 'Komoditas Pangan',
                    qty: (o.items?.[0]?.quantity || o.items?.[0]?.qty || 1) + ' kg',
                    nilai: Number(o.totalAmount || 0),
                    dbStatus: o.status,
                    tanggal: o.createdAt || o.date,
                    wilayah: o.supplierLocation || o.buyerAddress || 'Banyumas',
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

    // Filter transactions by selected region (or show all if no specific region selected)
    const filteredTransactions = selectedData 
        ? allTransactions.filter(trx => {
            const wLower = (trx.wilayah || '').toLowerCase();
            const sLower = selectedData.name.toLowerCase();
            return wLower.includes(sLower) || sLower.includes(wLower);
        })
        : allTransactions;

    return (
        <div className="flex flex-col w-full h-full bg-[#F8FAFC]">
            {/* Header Top Bar (Opsi B: Bersih & Resmi) */}
            <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 shrink-0 shadow-xs">
                <div>
                    <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Zona QRIS Banyumas Raya
                    </h1>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Batas administratif kabupaten & sebaran potensi transaksi QRIS komoditas pangan</p>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {tinggiCount} Transaksi Tinggi
                    </div>
                    {rendahCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100/50">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {rendahCount} Transaksi Rendah
                        </div>
                    )}
                    {kosongCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            {kosongCount} Belum Ada Data
                        </div>
                    )}
                </div>
            </div>

            {/* Map Canvas (100% Unblocked & Full Canvas) */}
            <div className="relative flex-1 w-full h-full overflow-hidden">
                <div className="absolute inset-0">
                    <LeafletPetaMap
                        wilayahData={displayRegions}
                        selected={selected}
                        onSelect={setSelected}
                        productPoints={points}
                    />
                </div>

                {/* FLOATING: Detail Panel (Top Right Overlay - Compact, Sleek, Scrollable) */}
                {selectedData && (
                    <div className="absolute top-4 right-4 z-10 w-80 md:w-84 max-h-[calc(100%-3rem)] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl p-4 scrollbar-thin">
                        <DetailPanel w={selectedData} transactions={filteredTransactions} onClose={() => setSelected(null)} />
                    </div>
                )}

                {/* FLOATING: Quick Region Selector (Bottom Overlay - Collapsible) */}
                {!showSelector ? (
                    <button
                        onClick={() => setShowSelector(true)}
                        className="absolute bottom-6 left-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm hover:scale-105"
                        title="Buka Pilihan Wilayah"
                    >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Pilihan Wilayah ({displayRegions.length})</span>
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                    </button>
                ) : (
                    <div className="absolute bottom-6 left-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-2.5 flex flex-wrap items-center gap-2 max-w-[calc(100%-2rem)] md:max-w-fit transition-all animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1 shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            Pilih Wilayah:
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {displayRegions.map((w) => {
                                const isSel = selected === w.id;
                                const isTinggi = w.status === 'tinggi' || w.status === 'melimpah';
                                return (
                                    <button
                                        key={w.id}
                                        onClick={() => setSelected(w.id)}
                                        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all duration-150 border whitespace-nowrap ${isSel
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="text-xs font-bold">{w.name}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isTinggi ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Minimize Button */}
                        <button
                            onClick={() => setShowSelector(false)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors ml-1 cursor-pointer"
                            title="Sembunyikan Pilihan Wilayah"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
