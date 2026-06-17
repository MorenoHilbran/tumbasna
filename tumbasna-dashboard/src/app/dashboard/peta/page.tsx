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
        <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center rounded-2xl"
            style={{ background: '#EDF2EA' }}>
            <Activity className="w-8 h-8 animate-spin mb-3" style={{ color: '#7FBB54' }} />
            <p className="text-xs font-semibold" style={{ color: '#8DA88F' }}>Memuat peta...</p>
        </div>
    ),
});

// ─── Detail Panel ─────────────────────────────────────────────
function DetailPanel({ w }: { w: typeof wilayahData[0] }) {
    return (
        <div className="flex flex-col h-full" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {/* Header */}
            <div className="p-5 rounded-2xl mb-4" style={{ background: w.status === 'melimpah' ? 'rgba(127,187,84,0.10)' : 'rgba(239,68,68,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: w.status === 'melimpah' ? '#7FBB54' : '#EF4444' }}
                    />
                    <span className="text-xs font-semibold capitalize"
                        style={{ color: w.status === 'melimpah' ? '#5E9C36' : '#DC2626' }}>
                        Stok {w.status}
                    </span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#1F3826' }}>{w.name}</h2>
                <p className="text-xs mt-1" style={{ color: '#8DA88F' }}>Luas wilayah: {w.luas.toLocaleString('id')} km²</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                    { label: 'Supplier', value: w.supplier, icon: Users, color: '#EB9728' },
                    { label: 'Buyer', value: w.buyer, icon: Users, color: '#697EE8' },
                    { label: 'Total Stok', value: w.stok, icon: Package, color: '#7FBB54' },
                    { label: 'Harga Rata-rata', value: w.hargaRataRata, icon: BarChart3, color: '#1F3826' },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: '#F4F7F2' }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                            <span className="text-[10px] font-medium" style={{ color: '#8DA88F' }}>{s.label}</span>
                        </div>
                        <p className="text-sm font-bold" style={{ color: '#1F3826' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Transaksi */}
            <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ background: '#F4F7F2' }}>
                <div>
                    <p className="text-[10px] font-medium" style={{ color: '#8DA88F' }}>Transaksi Bulan Ini</p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: '#1F3826' }}>{w.transaksi}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(105,126,232,0.10)' }}>
                    <TrendingUp className="w-5 h-5" style={{ color: '#697EE8' }} />
                </div>
            </div>

            {/* Komoditas */}
            <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#1F3826' }}>Komoditas Tersedia</p>
                <div className="flex flex-wrap gap-1.5">
                    {w.komoditas.map((k) => (
                        <span
                            key={k}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(127,187,84,0.10)', color: '#3A7A28', border: '1px solid rgba(127,187,84,0.25)' }}
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
        <div className="p-6 space-y-5" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1F3826' }}>Peta Komoditas</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8DA88F' }}>
                        Sebaran stok komoditas wilayah Barlingmascakeb
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(127,187,84,0.10)', color: '#5E9C36', border: '1px solid rgba(127,187,84,0.25)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {melimpahCount} Melimpah
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {menipisCount} Menipis
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 px-4 py-3 rounded-xl" style={{ background: 'white', border: '1px solid #DDE5D8' }}>
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" style={{ color: '#8DA88F' }} />
                    <span className="text-xs font-semibold" style={{ color: '#1F3826' }}>Legenda Peta</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(127,187,84,0.7)', border: '2px solid #7FBB54' }} />
                        <span className="text-xs font-medium" style={{ color: '#8DA88F' }}>Stok Melimpah</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ background: 'rgba(239,68,68,0.5)', border: '2px solid #EF4444' }} />
                        <span className="text-xs font-medium" style={{ color: '#8DA88F' }}>Stok Menipis</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                        <Info className="w-3.5 h-3.5" style={{ color: '#EB9728' }} />
                        <span className="text-xs" style={{ color: '#8DA88F' }}>Klik marker untuk detail</span>
                    </div>
                </div>
            </div>

            {/* Map + Detail */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Leaflet Map */}
                <div
                    className="xl:col-span-2 rounded-2xl overflow-hidden"
                    style={{ background: 'white', border: '1px solid #DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}
                >
                    <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#DDE5D8' }}>
                        <div>
                            <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>Peta Interaktif Wilayah</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#8DA88F' }}>Banyumas · Purbalingga · Banjarnegara · Cilacap · Kebumen</p>
                        </div>
                        <MapPin className="w-4 h-4" style={{ color: '#7FBB54' }} />
                    </div>

                    {/* Real Leaflet Map */}
                    <div style={{ height: '420px' }}>
                        <LeafletPetaMap
                            wilayahData={wilayahData}
                            selected={selected}
                            onSelect={setSelected}
                        />
                    </div>

                    {/* Quick stats footer */}
                    <div className="px-5 py-4 border-t grid grid-cols-5 gap-4" style={{ borderColor: '#DDE5D8' }}>
                        {wilayahData.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => setSelected(w.id)}
                                className="text-center rounded-xl py-2 px-1 transition-all duration-200"
                                style={{
                                    background: selected === w.id ? (w.status === 'melimpah' ? 'rgba(127,187,84,0.10)' : 'rgba(239,68,68,0.08)') : 'transparent',
                                    border: selected === w.id ? `1px solid ${w.status === 'melimpah' ? 'rgba(127,187,84,0.3)' : 'rgba(239,68,68,0.25)'}` : '1px solid transparent',
                                }}
                            >
                                <div className="w-2 h-2 rounded-full mx-auto mb-1"
                                    style={{ background: w.status === 'melimpah' ? '#7FBB54' : '#EF4444' }} />
                                <p className="text-[10px] font-bold" style={{ color: '#1F3826' }}>{w.name}</p>
                                <p className="text-[9px] mt-0.5" style={{ color: '#8DA88F' }}>{w.stok}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                <div
                    className="rounded-2xl p-5"
                    style={{ background: 'white', border: '1px solid #DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}
                >
                    {selectedData ? (
                        <DetailPanel w={selectedData} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#EDF2EA' }}>
                                <MapPin className="w-6 h-6" style={{ color: '#7FBB54' }} />
                            </div>
                            <p className="text-sm font-semibold" style={{ color: '#1F3826' }}>Pilih Wilayah</p>
                            <p className="text-xs mt-1" style={{ color: '#8DA88F' }}>Klik salah satu marker di peta untuk melihat detail</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Supplier', value: wilayahData.reduce((a, w) => a + w.supplier, 0), icon: Users, color: '#EB9728', bg: 'rgba(235,151,40,0.08)' },
                    { label: 'Total Buyer', value: wilayahData.reduce((a, w) => a + w.buyer, 0), icon: Users, color: '#697EE8', bg: 'rgba(105,126,232,0.08)' },
                    { label: 'Total Transaksi', value: wilayahData.reduce((a, w) => a + w.transaksi, 0), icon: TrendingUp, color: '#7FBB54', bg: 'rgba(127,187,84,0.08)' },
                    { label: 'Wilayah Dipantau', value: wilayahData.length, icon: MapPin, color: '#1F3826', bg: 'rgba(31,56,38,0.06)' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                            <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#8DA88F' }}>{s.label}</p>
                        <p className="text-2xl font-bold" style={{ color: '#1F3826' }}>{s.value.toLocaleString('id')}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
