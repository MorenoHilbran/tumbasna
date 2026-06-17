'use client';

import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ShoppingCart,
    Users,
    Package,
    Wallet,
    Activity,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    Truck,
    MapPin,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
const kpiData = [
    {
        id: 'transaksi',
        label: 'Total Transaksi',
        value: '12.847',
        change: '+8.2%',
        trend: 'up',
        icon: ShoppingCart,
        color: '#697EE8',
        bg: 'rgba(105,126,232,0.08)',
        period: 'vs bulan lalu',
    },
    {
        id: 'nilai',
        label: 'Nilai Transaksi',
        value: 'Rp 4,2M',
        change: '+12.5%',
        trend: 'up',
        icon: Wallet,
        color: '#7FBB54',
        bg: 'rgba(127,187,84,0.08)',
        period: 'vs bulan lalu',
    },
    {
        id: 'supplier',
        label: 'Total Supplier',
        value: '348',
        change: '+4.1%',
        trend: 'up',
        icon: Users,
        color: '#EB9728',
        bg: 'rgba(235,151,40,0.08)',
        period: 'vs bulan lalu',
    },
    {
        id: 'buyer',
        label: 'Total Buyer',
        value: '1.204',
        change: '-1.3%',
        trend: 'down',
        icon: Users,
        color: '#1F3826',
        bg: 'rgba(31,56,38,0.06)',
        period: 'vs bulan lalu',
    },
    {
        id: 'komoditas',
        label: 'Komoditas Aktif',
        value: '67',
        change: '+3',
        trend: 'up',
        icon: Package,
        color: '#7FBB54',
        bg: 'rgba(127,187,84,0.08)',
        period: 'produk baru',
    },
];

const dailyTransactions = [
    { day: 'Sen', value: 320, label: 'Senin' },
    { day: 'Sel', value: 485, label: 'Selasa' },
    { day: 'Rab', value: 392, label: 'Rabu' },
    { day: 'Kam', value: 618, label: 'Kamis' },
    { day: 'Jum', value: 554, label: 'Jumat' },
    { day: 'Sab', value: 287, label: 'Sabtu' },
    { day: 'Min', value: 190, label: 'Minggu' },
];

const topCommodities = [
    { name: 'Beras Premium', value: 2840, pct: 92, color: '#7FBB54' },
    { name: 'Cabai Merah', value: 2210, pct: 71, color: '#EB9728' },
    { name: 'Bawang Putih', value: 1890, pct: 61, color: '#697EE8' },
    { name: 'Jagung Pipil', value: 1540, pct: 50, color: '#7FBB54' },
    { name: 'Kedelai', value: 1230, pct: 40, color: '#EB9728' },
    { name: 'Gula Pasir', value: 980, pct: 32, color: '#697EE8' },
];

const recentActivities = [
    {
        id: 'TRX-8821',
        type: 'transaksi',
        title: 'Transaksi Beras Premium',
        sub: 'Buyer: Pasar Manis — Supplier: UD Tani Jaya',
        time: '2 menit lalu',
        status: 'selesai',
        amount: 'Rp 4.200.000',
    },
    {
        id: 'TRX-8820',
        type: 'transaksi',
        title: 'Transaksi Cabai Merah',
        sub: 'Buyer: RM Sederhana — Supplier: Kebun Hijau',
        time: '15 menit lalu',
        status: 'proses',
        amount: 'Rp 860.000',
    },
    {
        id: 'LOG-441',
        type: 'logistik',
        title: 'Pengiriman Berangkat',
        sub: 'Rute: Banyumas → Cilacap — 3 ton jagung',
        time: '32 menit lalu',
        status: 'jalan',
        amount: null,
    },
    {
        id: 'TRX-8819',
        type: 'transaksi',
        title: 'Transaksi Bawang Putih',
        sub: 'Buyer: Swalayan Maju — Supplier: CV Agro',
        time: '1 jam lalu',
        status: 'selesai',
        amount: 'Rp 2.100.000',
    },
    {
        id: 'TRX-8818',
        type: 'transaksi',
        title: 'Transaksi Gula Pasir',
        sub: 'Buyer: Toko Barokah — Supplier: PT Sweet',
        time: '1.5 jam lalu',
        status: 'batal',
        amount: 'Rp 1.500.000',
    },
];

const growthStats = [
    { label: 'Transaksi Harian', value: '423', suffix: 'tx/hari', change: '+8%', color: '#697EE8' },
    { label: 'Nilai Rata-rata', value: 'Rp 327K', suffix: '/transaksi', change: '+5.2%', color: '#7FBB54' },
    { label: 'Supplier Aktif', value: '87%', suffix: 'dari total', change: '+2%', color: '#EB9728' },
    { label: 'Rate Selesai', value: '94.2%', suffix: 'berhasil', change: '+1.1%', color: '#1F3826' },
];

// ─── Chart Bar Component ──────────────────────────────────────
function BarChart() {
    const max = Math.max(...dailyTransactions.map(d => d.value));
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="flex items-end gap-2 h-44 px-2">
            {dailyTransactions.map((d, i) => {
                const heightPct = (d.value / max) * 100;
                const isHov = hovered === i;
                return (
                    <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {isHov && (
                            <div className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: '#1F3826', color: '#7FBB54', fontFamily: 'Poppins, sans-serif' }}>
                                {d.value}
                            </div>
                        )}
                        <div
                            className="w-full rounded-t-lg transition-all duration-300"
                            style={{
                                height: `${heightPct}%`,
                                background: isHov
                                    ? 'linear-gradient(180deg, #7FBB54 0%, #5E9C36 100%)'
                                    : 'linear-gradient(180deg, #697EE8 0%, #4C5DD4 100%)',
                                opacity: isHov ? 1 : 0.75,
                                minHeight: '6px',
                            }}
                        />
                        <span className="text-[10px] font-medium" style={{ color: '#8DA88F', fontFamily: 'Poppins, sans-serif' }}>{d.day}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        selesai: { bg: 'rgba(127,187,84,0.12)', color: '#5E9C36', label: 'Selesai' },
        proses: { bg: 'rgba(105,126,232,0.12)', color: '#4C5DD4', label: 'Proses' },
        jalan: { bg: 'rgba(235,151,40,0.12)', color: '#C47D10', label: 'Jalan' },
        batal: { bg: 'rgba(239,68,68,0.10)', color: '#DC2626', label: 'Dibatalkan' },
    };
    const s = map[status] ?? map.proses;
    return (
        <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: s.bg, color: s.color, fontFamily: 'Poppins, sans-serif' }}
        >
            {s.label}
        </span>
    );
}

// ─── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
    return (
        <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins, sans-serif' }}>

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#1F3826' }}>Dashboard</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8DA88F' }}>
                        Ringkasan performa platform monitoring komoditas pangan
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'white', color: '#1F3826', border: '1px solid #DDE5D8' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#EB9728' }} />
                    Sabtu, 6 Juni 2026 — 18:00 WIB
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiData.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.id}
                            className="bg-white rounded-2xl p-4 border card-hover"
                            style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-semibold"
                                    style={{ color: kpi.trend === 'up' ? '#5E9C36' : '#DC2626' }}>
                                    {kpi.trend === 'up'
                                        ? <TrendingUp className="w-3 h-3" />
                                        : <TrendingDown className="w-3 h-3" />}
                                    {kpi.change}
                                </div>
                            </div>
                            <p className="text-[11px] font-medium mb-1" style={{ color: '#8DA88F' }}>{kpi.label}</p>
                            <p className="text-xl font-bold" style={{ color: '#1F3826' }}>{kpi.value}</p>
                            <p className="text-[10px] mt-1" style={{ color: '#aaa' }}>{kpi.period}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Daily Transactions Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-bold" style={{ color: '#1F3826' }}>Grafik Transaksi Harian</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#8DA88F' }}>Volume transaksi 7 hari terakhir</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: '#EDF2EA', color: '#1F3826' }}>
                            <BarChart3 className="w-3.5 h-3.5" style={{ color: '#7FBB54' }} />
                            Minggu Ini
                        </div>
                    </div>
                    <BarChart />
                    <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: '#DDE5D8' }}>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #697EE8 0%, #4C5DD4 100%)' }} />
                                <span className="text-[11px] font-medium" style={{ color: '#8DA88F' }}>Volume Transaksi</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #7FBB54 0%, #5E9C36 100%)' }} />
                                <span className="text-[11px] font-medium" style={{ color: '#8DA88F' }}>Hover untuk detail</span>
                            </div>
                        </div>
                        <span className="text-xs font-bold" style={{ color: '#1F3826' }}>Total: 2.846 transaksi</span>
                    </div>
                </div>

                {/* Top Commodities */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-bold" style={{ color: '#1F3826' }}>Komoditas Terlaris</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#8DA88F' }}>Berdasarkan volume transaksi</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4" style={{ color: '#7FBB54' }} />
                    </div>
                    <div className="space-y-3">
                        {topCommodities.map((c, i) => (
                            <div key={c.name} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold w-4" style={{ color: '#8DA88F' }}>#{i + 1}</span>
                                        <span className="text-xs font-semibold" style={{ color: '#1F3826' }}>{c.name}</span>
                                    </div>
                                    <span className="text-[11px] font-bold" style={{ color: c.color }}>{c.value.toLocaleString('id')} kg</span>
                                </div>
                                <div className="h-1.5 rounded-full" style={{ background: '#EDF2EA' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${c.pct}%`, background: c.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Growth Stats + Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Growth Stats */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <h2 className="text-base font-bold mb-1" style={{ color: '#1F3826' }}>Statistik Pertumbuhan</h2>
                    <p className="text-xs mb-5" style={{ color: '#8DA88F' }}>Performa platform bulan ini</p>
                    <div className="grid grid-cols-2 gap-3">
                        {growthStats.map((stat) => (
                            <div key={stat.label} className="rounded-xl p-3" style={{ background: '#F4F7F2' }}>
                                <p className="text-[10px] font-medium mb-1" style={{ color: '#8DA88F' }}>{stat.label}</p>
                                <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: '#aaa' }}>{stat.suffix}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="w-2.5 h-2.5" style={{ color: '#7FBB54' }} />
                                    <span className="text-[10px] font-bold" style={{ color: '#7FBB54' }}>{stat.change}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-5 border" style={{ borderColor: '#DDE5D8', boxShadow: '0 2px 12px rgba(31,56,38,0.06)' }}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-bold" style={{ color: '#1F3826' }}>Aktivitas Terbaru</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#8DA88F' }}>Real-time log transaksi & logistik</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#697EE8' }}>
                            <Activity className="w-3.5 h-3.5" />
                            Live
                        </div>
                    </div>
                    <div className="space-y-3">
                        {recentActivities.map((act) => (
                            <div
                                key={act.id}
                                className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-sm"
                                style={{ background: '#F4F7F2' }}
                            >
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{
                                        background: act.type === 'logistik' ? 'rgba(235,151,40,0.12)' : 'rgba(105,126,232,0.10)',
                                    }}
                                >
                                    {act.type === 'logistik'
                                        ? <Truck className="w-4 h-4" style={{ color: '#EB9728' }} />
                                        : <ShoppingCart className="w-4 h-4" style={{ color: '#697EE8' }} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-semibold" style={{ color: '#1F3826' }}>{act.title}</p>
                                        <StatusBadge status={act.status} />
                                    </div>
                                    <p className="text-[11px] mt-0.5 truncate" style={{ color: '#8DA88F' }}>{act.sub}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px]" style={{ color: '#aaa' }}>{act.id}</span>
                                        <span className="text-[10px]" style={{ color: '#aaa' }}>{act.time}</span>
                                    </div>
                                </div>
                                {act.amount && (
                                    <p className="text-xs font-bold flex-shrink-0" style={{ color: '#1F3826' }}>{act.amount}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Info Strip */}
            <div className="rounded-2xl p-4 flex flex-wrap items-center gap-6" style={{ background: '#1F3826' }}>
                {[
                    { icon: MapPin, label: 'Wilayah Aktif', value: '5 Kabupaten', color: '#7FBB54' },
                    { icon: Package, label: 'Stok Melimpah', value: '3 Wilayah', color: '#7FBB54' },
                    { icon: AlertCircle, label: 'Stok Menipis', value: '2 Wilayah', color: '#EB9728' },
                    { icon: CheckCircle2, label: 'Transaksi Hari Ini', value: '423 Selesai', color: '#697EE8' },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</p>
                            <p className="text-sm font-bold" style={{ color: 'white' }}>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
