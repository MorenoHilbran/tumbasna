'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
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
} from 'lucide-react';

// ─── Wilayah Data ─────────────────────────────────────────────
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
        transaksi: 143,
        lat: -7.6701,
        lng: 109.6524,
        luas: 1282,
        radius: 16000,
    },
];

// ─── Dynamic Leaflet Map (client-only) ────────────────────────
const LeafletPetaMap = dynamic(() => import('@/components/PetaMapLeaflet'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-r border-slate-200/65">
            <Activity className="w-6 h-6 animate-spin mb-3 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-400">Memuat peta interaktif...</p>
        </div>
    ),
});

// ─── Detail Panel ─────────────────────────────────────────────
function DetailPanel({ w, onClose }: { w: typeof wilayahData[0]; onClose: () => void }) {
    const isMelimpah = w.status === 'melimpah';
    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* Header */}
            <div className={`p-4 rounded-xl mb-4 border ${
                isMelimpah ? 'bg-emerald-50/70 border-emerald-100/50' : 'bg-rose-50/70 border-rose-100/50'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isMelimpah ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            isMelimpah ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                            Stok {w.status}
                        </span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-white/50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mt-2 tracking-tight">{w.name}</h2>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">Luas wilayah: {w.luas.toLocaleString('id-ID')} km²</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                    { label: 'Supplier', value: w.supplier, icon: Users, color: '#F59E0B', bg: 'bg-amber-50 text-amber-600' },
                    { label: 'Buyer', value: w.buyer, icon: Users, color: '#10B981', bg: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Total Stok', value: w.stok, icon: Package, color: '#10B981', bg: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Harga Rata-rata', value: w.hargaRataRata, icon: BarChart3, color: '#0F172A', bg: 'bg-slate-100 text-slate-700' },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 bg-slate-50 border border-slate-100/80">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className="text-xs font-extrabold text-slate-800">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Transaksi */}
            <div className="rounded-xl p-3 mb-4 flex items-center justify-between bg-slate-50 border border-slate-100/80">
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Transaksi Bulan Ini</p>
                    <p className="text-lg font-extrabold text-slate-800 mt-1.5 leading-none">{w.transaksi}</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4.5 h-4.5" />
                </div>
            </div>

            {/* Komoditas */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Komoditas Tersedia</p>
                <div className="flex flex-wrap gap-1.5">
                    {w.komoditas.map((k) => (
                        <span
                            key={k}
                            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/40 text-slate-600"
                        >
                            {k}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Peta Page ───────────────────────────────────────────
export default function PetaPage() {
    const [selected, setSelected] = useState<string | null>('banyumas');

    const selectedData = wilayahData.find(w => w.id === selected);
    const melimpahCount = wilayahData.filter(w => w.status === 'melimpah').length;
    const menipisCount = wilayahData.filter(w => w.status === 'menipis').length;

    return (
        <div className="relative w-full h-[calc(100vh-57px)] lg:h-[calc(100vh-73px)] overflow-hidden bg-slate-50">

            {/* Real Leaflet Map - Full Bleed Background */}
            <div className="absolute inset-0 z-0">
                <LeafletPetaMap
                    wilayahData={wilayahData}
                    selected={selected}
                    onSelect={setSelected}
                />
            </div>

            {/* FLOATING: Page Title & Legend (Top Left Overlay) */}
            <div className="absolute top-4 left-4 z-10 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-4 hidden md:block">
                <div>
                    <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">Peta Komoditas</h1>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Sebaran wilayah Barlingmascakeb</p>
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
                    <DetailPanel w={selectedData} onClose={() => setSelected(null)} />
                </div>
            )}

            {/* FLOATING: Quick Region Selector (Bottom Overlay) */}
            <div className="absolute bottom-6 left-4 right-4 md:left-4 md:right-auto z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-3 overflow-x-auto flex items-center gap-2 max-w-full md:max-w-[calc(100%-416px)] scrollbar-thin">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 whitespace-nowrap flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    Pilih Wilayah:
                </span>
                
                <div className="flex items-center gap-1.5">
                    {wilayahData.map((w) => {
                        const isSel = selected === w.id;
                        return (
                            <button
                                key={w.id}
                                onClick={() => setSelected(w.id)}
                                className={`flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all duration-150 border whitespace-nowrap ${
                                    isSel
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    w.status === 'melimpah' ? (isSel ? 'bg-white' : 'bg-emerald-500') : (isSel ? 'bg-white' : 'bg-rose-500')
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
