'use client';

import dynamic from 'next/dynamic';
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
    Fuel,
    Route,
    Weight,
    Activity,
    TrendingUp,
} from 'lucide-react';

// ─── Dynamic Import for Leaflet Map ──────────────────────────
const LogistikMap = dynamic(() => import('@/components/LogistikMapLeaflet'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
            <Activity className="w-6 h-6 animate-spin mb-3 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-400">Memuat peta pelacakan...</p>
        </div>
    ),
});

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
const statusMap: Record<string, { bg: string; color: string; label: string }> = {
    jalan: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100/50', label: 'Dalam Perjalanan' },
    selesai: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/50', label: 'Selesai' },
    standby: { bg: 'bg-slate-100 text-slate-600 border-slate-200/50', label: 'Standby' },
    masalah: { bg: 'bg-rose-50 text-rose-600 border-rose-100/50', label: 'Bermasalah' },
};

function StatusPill({ status }: { status: string }) {
    const s = statusMap[status] ?? statusMap.standby;
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.bg}`}>
            {s.label}
        </span>
    );
}

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ value, status }: { value: number; status: string }) {
    const barColor = status === 'selesai' ? 'bg-emerald-500' : status === 'masalah' ? 'bg-rose-500' : 'bg-emerald-600';
    return (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${value}%` }} />
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
        <div className="p-8 space-y-8 bg-[#F8FAFC]">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Monitoring Logistik</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Lacak posisi armada secara real-time, pantau rute pengiriman, dan optimasi backhaul
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 self-start md:self-auto">
                    <Navigation className="w-4 h-4" />
                    {jalans} Armada Aktif
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Dalam Perjalanan', value: jalans, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50/70' },
                    { label: 'Selesai Hari Ini', value: selesai, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/70' },
                    { label: 'Standby', value: standbys, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100/70' },
                    { label: 'Bermasalah', value: masalahs, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50/70' },
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

            {/* Main Content Split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Side: Map + Fleet Grid */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Live Tracking Map Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">Peta Pelacakan Armada Real-Time</h2>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Lacak rute pengiriman dan posisi truk saat ini di peta</p>
                            </div>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Live GPS Tracking
                            </span>
                        </div>

                        {/* Interactive map container */}
                        <div className="h-[400px] w-full relative bg-slate-50">
                            <LogistikMap 
                                armadaData={armadaData}
                                selectedId={selectedArmada.id}
                                onSelect={(id) => {
                                    const match = armadaData.find(a => a.id === id);
                                    if (match) setSelectedArmada(match);
                                }}
                            />
                        </div>
                    </div>

                    {/* Fleet Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Daftar Armada</h2>
                            <p className="text-xs text-slate-400 font-medium">{armadaData.length} armada terdaftar</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {armadaData.map((a) => {
                                const isSelected = selectedArmada.id === a.id;
                                return (
                                    <div
                                        key={a.id}
                                        onClick={() => setSelectedArmada(a)}
                                        className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all duration-150 ${
                                            isSelected 
                                                ? 'border-emerald-600 shadow-md bg-emerald-50/10' 
                                                : 'border-slate-200/60 shadow-sm hover:border-slate-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500'
                                                }`}>
                                                    <Truck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{a.id}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{a.driver} • {a.plat}</p>
                                                </div>
                                            </div>
                                            <StatusPill status={a.status} />
                                        </div>

                                        {/* Route */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-600">{a.rute.dari}</span>
                                            </div>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[10px] font-bold text-slate-600">{a.rute.ke}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 ml-auto font-mono">{a.jarak}</span>
                                        </div>

                                        {/* Muatan */}
                                        <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-slate-600">
                                            <Package className="w-4 h-4 text-amber-500" />
                                            <span>{a.muatan}</span>
                                        </div>

                                        {/* Progress */}
                                        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100/60">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-semibold text-slate-400">Progress Pengiriman</span>
                                                <span className="font-bold text-slate-700">{a.progress}%</span>
                                            </div>
                                            <ProgressBar value={a.progress} status={a.status} />
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                                                <span>ETA: {a.estimasi}</span>
                                                <span>BBM: {a.bahan_bakar}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Side: Telemetry Details + Stats */}
                <div className="space-y-6">

                    {/* Selected Armada Details */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Detail Armada</h2>

                        <div className="rounded-2xl p-5 mb-5 bg-slate-900 border border-slate-800 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 text-emerald-400 border border-slate-700/50">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-white">{selectedArmada.id}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{selectedArmada.plat}</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-200 mb-2">{selectedArmada.driver}</p>
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700/50">
                                    {statusMap[selectedArmada.status].label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">{selectedArmada.estimasi}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Rute', value: `${selectedArmada.rute.dari} → ${selectedArmada.rute.ke}`, icon: Route, color: '#10B981' },
                                { label: 'Jarak', value: selectedArmada.jarak, icon: Navigation, color: '#10B981' },
                                { label: 'BBM', value: selectedArmada.bahan_bakar, icon: Fuel, color: '#F59E0B' },
                                { label: 'Muatan', value: selectedArmada.muatan.split('—')[1]?.trim() ?? '—', icon: Weight, color: '#64748B' },
                            ].map(item => (
                                <div key={item.label} className="rounded-xl p-3 bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <p className="text-xs font-extrabold text-slate-800 truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Route Stats */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Analitik Rute</h2>
                        </div>
                        <div className="space-y-4">
                            {routeStats.map((r) => (
                                <div key={r.rute} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-700 truncate">{r.rute}</span>
                                        <span className="font-bold text-slate-400 ml-2">{r.frekuensi}x</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.utilitas}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-0.5">
                                        <span>{r.total_ton} ton dikirim</span>
                                        <span>{r.utilitas}% utilitas</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Backhaul efficiency */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Efisiensi Backhaul</p>
                        </div>
                        <div>
                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">78.4%</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Penghematan rute truk pulang kosong</p>
                            <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: '78.4%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
