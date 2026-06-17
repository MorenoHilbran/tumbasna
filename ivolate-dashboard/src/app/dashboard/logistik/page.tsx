'use client';

import { useState } from 'react';
import {
    Truck,
    MapPin,
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    Navigation,
    BarChart3,
    ArrowRight,
    Users,
    TrendingUp,
    Fuel,
    Route,
    Weight,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
const armadaData = [
    {
        id: 'ARM-001',
        driver: 'Budi Santoso',
        plat: 'R 1234 AB',
        rute: { dari: 'Banyumas', ke: 'Cilacap' },
        muatan: 'Beras Premium — 3.2 ton',
        status: 'jalan',
        progress: 68,
        estimasi: '45 menit',
        jarak: '87 km',
        bahan_bakar: '82%',
        suhu: '24°C',
    },
    {
        id: 'ARM-002',
        driver: 'Agus Prasetyo',
        plat: 'R 5678 CD',
        rute: { dari: 'Cilacap', ke: 'Kebumen' },
        muatan: 'Cabai Merah — 1.5 ton',
        status: 'jalan',
        progress: 35,
        estimasi: '1 jam 20 menit',
        jarak: '112 km',
        bahan_bakar: '65%',
        suhu: '22°C',
    },
    {
        id: 'ARM-003',
        driver: 'Rudi Hartono',
        plat: 'R 9012 EF',
        rute: { dari: 'Purbalingga', ke: 'Banyumas' },
        muatan: 'Kopi — 2.1 ton',
        status: 'selesai',
        progress: 100,
        estimasi: 'Selesai',
        jarak: '45 km',
        bahan_bakar: '91%',
        suhu: '26°C',
    },
    {
        id: 'ARM-004',
        driver: 'Hendra Wijaya',
        plat: 'R 3456 GH',
        rute: { dari: 'Banjarnegara', ke: 'Purbalingga' },
        muatan: 'Kentang — 0.8 ton',
        status: 'standby',
        progress: 0,
        estimasi: 'Belum berangkat',
        jarak: '38 km',
        bahan_bakar: '100%',
        suhu: '—',
    },
    {
        id: 'ARM-005',
        driver: 'Slamet Riyadi',
        plat: 'R 7890 IJ',
        rute: { dari: 'Kebumen', ke: 'Cilacap' },
        muatan: 'Gula Pasir — 4.0 ton',
        status: 'masalah',
        progress: 52,
        estimasi: 'Tertunda',
        jarak: '78 km',
        bahan_bakar: '45%',
        suhu: '28°C',
    },
];

const routeStats = [
    { rute: 'Banyumas → Cilacap', frekuensi: 42, total_ton: 124.5, avg_waktu: '85 mnt', utilitas: 94 },
    { rute: 'Cilacap → Kebumen', frekuensi: 28, total_ton: 78.3, avg_waktu: '120 mnt', utilitas: 76 },
    { rute: 'Purbalingga → Banyumas', frekuensi: 35, total_ton: 92.1, avg_waktu: '45 mnt', utilitas: 88 },
    { rute: 'Banjarnegara → Purbalingga', frekuensi: 19, total_ton: 41.7, avg_waktu: '40 mnt', utilitas: 62 },
    { rute: 'Kebumen → Cilacap', frekuensi: 23, total_ton: 67.4, avg_waktu: '110 mnt', utilitas: 71 },
];

// ─── Status helpers ───────────────────────────────────────────
const statusMap: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    jalan: { bg: 'rgba(105,126,232,0.12)', color: '#4C5DD4', label: 'Dalam Perjalanan', dot: '#697EE8' },
    selesai: { bg: 'rgba(127,187,84,0.12)', color: '#5E9C36', label: 'Selesai', dot: '#7FBB54' },
    standby: { bg: 'rgba(235,151,40,0.12)', color: '#C47D10', label: 'Standby', dot: '#EB9728' },
    masalah: { bg: 'rgba(239,68,68,0.10)', color: '#DC2626', label: 'Masalah', dot: '#EF4444' },
};

function StatusPill({ status }: { status: string }) {
    const s = statusMap[status] ?? statusMap.standby;
    return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color, fontFamily: 'Poppins, sans-serif' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
            {s.label}
        </span>
    );
}

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ value, status }: { value: number; status: string }) {
    const color = status === 'selesai' ? '#7FBB54' : status === 'masalah' ? '#EF4444' : '#697EE8';
    return (
        <div className="h-1.5 rounded-full w-full" style={{ background: '#EDF2EA' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
        </div>
    );
}

// ─── Main Logistik Page ───────────────────────────────────────
export default function LogistikPage() {
    const [selectedArmada, setSelectedArmada] = useState(armadaData[0]);

    const jalans = armadaData.filter(a => a.status === 'jalan').length;
    const selesai = armadaData.filter(a => a.status === 'selesai').length;
    const standbys = armadaData.filter(a => a.status === 'standby').length;
    const masalahs = armadaData.filter(a => a.status === 'masalah').length;

    return (
        <div className="p-6 space-y-5" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1F3826' }}>Monitoring Logistik</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8DA88F' }}>
                        Rute pengiriman, status armada, dan optimasi backhaul
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(105,126,232,0.10)', color: '#4C5DD4' }}>
                    <Navigation className="w-3.5 h-3.5" />
                    {jalans} Armada Aktif
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Dalam Perjalanan', value: jalans, icon: Truck, color: '#697EE8', bg: 'rgba(105,126,232,0.08)' },
                    { label: 'Selesai Hari Ini', value: selesai, icon: CheckCircle2, color: '#7FBB54', bg: 'rgba(127,187,84,0.08)' },
                    { label: 'Standby', value: standbys, icon: Clock, color: '#EB9728', bg: 'rgba(235,151,40,0.08)' },
                    { label: 'Bermasalah', value: masalahs, icon: AlertCircle, color: '#DC2626', bg: 'rgba(239,68,68,0.08)' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border card-hover" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium" style={{ color: '#8DA88F' }}>{s.label}</p>
                                <p className="text-xl font-bold" style={{ color: '#1F3826' }}>{s.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main: Fleet List + Detail */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Fleet Cards */}
                <div className="xl:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>Daftar Armada</h2>
                        <p className="text-xs" style={{ color: '#8DA88F' }}>{armadaData.length} armada terdaftar</p>
                    </div>
                    {armadaData.map((a) => (
                        <div
                            key={a.id}
                            onClick={() => setSelectedArmada(a)}
                            className="bg-white rounded-2xl p-4 border cursor-pointer transition-all duration-200"
                            style={{
                                borderColor: selectedArmada.id === a.id ? '#7FBB54' : '#DDE5D8',
                                boxShadow: selectedArmada.id === a.id ? '0 4px 20px rgba(127,187,84,0.15)' : '0 2px 12px rgba(31,56,38,0.06)',
                                background: selectedArmada.id === a.id ? 'rgba(127,187,84,0.03)' : 'white',
                            }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: selectedArmada.id === a.id ? '#1F3826' : '#EDF2EA' }}>
                                        <Truck className="w-5 h-5" style={{ color: selectedArmada.id === a.id ? '#7FBB54' : '#7FBB54' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold" style={{ color: '#1F3826' }}>{a.id}</p>
                                        <p className="text-[11px]" style={{ color: '#8DA88F' }}>{a.driver} • {a.plat}</p>
                                    </div>
                                </div>
                                <StatusPill status={a.status} />
                            </div>

                            {/* Route */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(127,187,84,0.10)' }}>
                                    <MapPin className="w-3 h-3" style={{ color: '#7FBB54' }} />
                                    <span className="text-[11px] font-semibold" style={{ color: '#5E9C36' }}>{a.rute.dari}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5" style={{ color: '#DDE5D8' }} />
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(105,126,232,0.10)' }}>
                                    <MapPin className="w-3 h-3" style={{ color: '#697EE8' }} />
                                    <span className="text-[11px] font-semibold" style={{ color: '#4C5DD4' }}>{a.rute.ke}</span>
                                </div>
                                <span className="text-[10px] ml-auto" style={{ color: '#8DA88F' }}>{a.jarak}</span>
                            </div>

                            {/* Muatan */}
                            <div className="flex items-center gap-1.5 mb-3">
                                <Package className="w-3.5 h-3.5" style={{ color: '#EB9728' }} />
                                <span className="text-[11px] font-medium" style={{ color: '#8DA88F' }}>{a.muatan}</span>
                            </div>

                            {/* Progress */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium" style={{ color: '#8DA88F' }}>Progress Pengiriman</span>
                                    <span className="text-[10px] font-bold" style={{ color: '#1F3826' }}>{a.progress}%</span>
                                </div>
                                <ProgressBar value={a.progress} status={a.status} />
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px]" style={{ color: '#8DA88F' }}>ETA: {a.estimasi}</span>
                                    <span className="text-[10px]" style={{ color: '#8DA88F' }}>BBM: {a.bahan_bakar}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Panel */}
                <div className="space-y-4">

                    {/* Armada Detail */}
                    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                        <h2 className="text-sm font-bold mb-4" style={{ color: '#1F3826' }}>Detail Armada</h2>

                        <div className="rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1F3826 0%, #2D5038 100%)' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(127,187,84,0.2)' }}>
                                    <Truck className="w-5 h-5" style={{ color: '#7FBB54' }} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{selectedArmada.id}</p>
                                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedArmada.plat}</p>
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-white mb-1">{selectedArmada.driver}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,187,84,0.2)', color: '#7FBB54' }}>
                                    {statusMap[selectedArmada.status].label}
                                </span>
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedArmada.estimasi}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Rute', value: `${selectedArmada.rute.dari} → ${selectedArmada.rute.ke}`, icon: Route, color: '#697EE8' },
                                { label: 'Jarak', value: selectedArmada.jarak, icon: Navigation, color: '#7FBB54' },
                                { label: 'BBM', value: selectedArmada.bahan_bakar, icon: Fuel, color: '#EB9728' },
                                { label: 'Muatan', value: selectedArmada.muatan.split('—')[1]?.trim() ?? '—', icon: Weight, color: '#1F3826' },
                            ].map(item => (
                                <div key={item.label} className="rounded-xl p-3" style={{ background: '#F4F7F2' }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <item.icon className="w-3 h-3" style={{ color: item.color }} />
                                        <span className="text-[9px] font-medium" style={{ color: '#8DA88F' }}>{item.label}</span>
                                    </div>
                                    <p className="text-[11px] font-bold" style={{ color: '#1F3826' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Route Stats */}
                    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4" style={{ color: '#7FBB54' }} />
                            <h2 className="text-sm font-bold" style={{ color: '#1F3826' }}>Analitik Rute</h2>
                        </div>
                        <div className="space-y-3">
                            {routeStats.map((r) => (
                                <div key={r.rute}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-medium truncate" style={{ color: '#1F3826' }}>{r.rute}</span>
                                        <span className="text-[10px] font-bold ml-2" style={{ color: '#8DA88F' }}>{r.frekuensi}x</span>
                                    </div>
                                    <div className="h-1.5 rounded-full" style={{ background: '#EDF2EA' }}>
                                        <div className="h-full rounded-full" style={{ width: `${r.utilitas}%`, background: `linear-gradient(90deg, #7FBB54, #697EE8)` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[9px]" style={{ color: '#8DA88F' }}>{r.total_ton} ton dikirim</span>
                                        <span className="text-[9px]" style={{ color: '#8DA88F' }}>{r.utilitas}% utilitas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Backhaul efficiency */}
                    <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #697EE8 0%, #4C5DD4 100%)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-white" />
                            <p className="text-xs font-bold text-white">Efisiensi Backhaul</p>
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">78.4%</p>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>Penghematan rute truk pulang kosong</p>
                        <div className="mt-3 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                            <div className="h-full rounded-full" style={{ width: '78.4%', background: '#7FBB54' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
