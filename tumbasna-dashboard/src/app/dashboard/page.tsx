'use client';

import { useState, useEffect } from 'react';
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
    ArrowRight,
    Calendar,
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
        color: '#059669', // Emerald-600 (Premium Green)
        bg: 'bg-emerald-50/70',
        period: 'vs bulan lalu',
    },
    {
        id: 'nilai',
        label: 'Nilai Transaksi',
        value: 'Rp 4,2M',
        change: '+12.5%',
        trend: 'up',
        icon: Wallet,
        color: '#059669',
        bg: 'bg-emerald-50/70',
        period: 'vs bulan lalu',
    },
    {
        id: 'supplier',
        label: 'Total Supplier',
        value: '348',
        change: '+4.1%',
        trend: 'up',
        icon: Users,
        color: '#D97706', // Amber
        bg: 'bg-amber-50/70',
        period: 'vs bulan lalu',
    },
    {
        id: 'buyer',
        label: 'Total Buyer',
        value: '1.204',
        change: '-1.3%',
        trend: 'down',
        icon: Users,
        color: '#475569', // Slate
        bg: 'bg-slate-100/70',
        period: 'vs bulan lalu',
    },
    {
        id: 'komoditas',
        label: 'Komoditas Aktif',
        value: '67',
        change: '+3',
        trend: 'up',
        icon: Package,
        color: '#059669',
        bg: 'bg-emerald-50/70',
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
    { name: 'Beras Premium', value: 2840, pct: 92, color: '#10B981' }, // Emerald
    { name: 'Cabai Merah', value: 2210, pct: 71, color: '#F59E0B' }, // Amber
    { name: 'Bawang Putih', value: 1890, pct: 61, color: '#059669' }, // Emerald-600
    { name: 'Jagung Pipil', value: 1540, pct: 50, color: '#06B6D4' }, // Cyan
    { name: 'Kedelai', value: 1230, pct: 40, color: '#8B5CF6' }, // Purple
    { name: 'Gula Pasir', value: 980, pct: 32, color: '#6366F1' }, // Indigo
];

const recentActivities = [
    {
        id: 'TRX-8821',
        type: 'transaksi',
        title: 'Transaksi Beras Premium',
        from: 'UD Tani Jaya',
        to: 'Pasar Manis',
        time: '2 menit lalu',
        status: 'selesai',
        amount: 'Rp 4.200.000',
    },
    {
        id: 'TRX-8820',
        type: 'transaksi',
        title: 'Transaksi Cabai Merah',
        from: 'Kebun Hijau',
        to: 'RM Sederhana',
        time: '15 menit lalu',
        status: 'proses',
        amount: 'Rp 860.000',
    },
    {
        id: 'LOG-441',
        type: 'logistik',
        title: 'Pengiriman Jagung Pipil',
        from: 'Gudang Banyumas',
        to: 'Hub Cilacap',
        time: '32 menit lalu',
        status: 'jalan',
        amount: '3.0 ton',
    },
    {
        id: 'TRX-8819',
        type: 'transaksi',
        title: 'Transaksi Bawang Putih',
        from: 'CV Agro Mandiri',
        to: 'Swalayan Maju',
        time: '1 jam lalu',
        status: 'selesai',
        amount: 'Rp 2.100.000',
    },
    {
        id: 'TRX-8818',
        type: 'transaksi',
        title: 'Transaksi Gula Pasir',
        from: 'PT Sweet Sugar',
        to: 'Toko Barokah',
        time: '1.5 jam lalu',
        status: 'batal',
        amount: 'Rp 1.500.000',
    },
];

const growthStats = [
    { label: 'Transaksi Harian', value: '423', suffix: 'tx/hari', change: '+8%', color: '#059669' },
    { label: 'Nilai Rata-rata', value: 'Rp 327K', suffix: '/transaksi', change: '+5.2%', color: '#10B981' },
    { label: 'Supplier Aktif', value: '87%', suffix: 'dari total', change: '+2%', color: '#F59E0B' },
    { label: 'Rate Selesai', value: '94.2%', suffix: 'berhasil', change: '+1.1%', color: '#0F172A' },
];

// ─── Chart Bar Component ──────────────────────────────────────
function BarChart({ transactions }: { transactions: typeof dailyTransactions }) {
    const max = Math.max(...transactions.map(d => d.value), 1);
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="flex items-end gap-3 h-48 px-2">
            {transactions.map((d, i) => {
                const heightPct = (d.value / max) * 100;
                const isHov = hovered === i;
                return (
                    <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <div className="h-6 relative w-full flex justify-center">
                            {isHov && (
                                <div className="absolute bottom-0 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white shadow-sm whitespace-nowrap z-10">
                                    {d.value} tx
                                </div>
                            )}
                        </div>
                        <div
                            className="w-full rounded-t transition-all duration-200"
                            style={{
                                height: `${heightPct}%`,
                                backgroundColor: isHov ? '#047857' : '#059669', // Emerald-700 / Emerald-600
                                opacity: isHov ? 1 : 0.85,
                                minHeight: '8px',
                            }}
                        />
                        <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-700 transition-colors uppercase tracking-wider">{d.day}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; label: string }> = {
        selesai: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100/50', label: 'Selesai' },
        proses: { bg: 'bg-emerald-50/50 text-emerald-700 border-emerald-100/30', label: 'Proses' },
        jalan: { bg: 'bg-amber-50 text-amber-600 border-amber-100/50', label: 'Jalan' },
        batal: { bg: 'bg-rose-50 text-rose-600 border-rose-100/50', label: 'Batal' },
    };
    const s = map[status] ?? map.proses;
    return (
        <span
            className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.bg}`}
        >
            {s.label}
        </span>
    );
}

// ─── Route Visualizer Component (Reference Aesthetic) ─────────
function RouteVisualizer({ from, to }: { from: string; to: string }) {
    return (
        <div className="flex flex-col gap-2 my-3 pl-1.5 border-l border-dashed border-slate-200 relative">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex-shrink-0 -ml-[9px] z-10" />
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dari</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{from}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-50 flex-shrink-0 -ml-[9px] z-10" />
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ke</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{to}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard Page ──────────────────────────────────────
export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (!res.ok) throw new Error('Gagal memuat data statistik');
                const json = await res.json();
                if (json.success) {
                    setStats(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const activeKpiData = [
        {
            id: 'transaksi',
            label: 'Total Transaksi',
            value: stats ? stats.kpi.totalTransactions.toLocaleString('id-ID') : '0',
            change: '+8.2%',
            trend: 'up',
            icon: ShoppingCart,
            color: '#059669',
            bg: 'bg-emerald-50/70',
            period: 'real-time',
        },
        {
            id: 'nilai',
            label: 'Nilai Transaksi',
            value: stats ? `Rp ${stats.kpi.totalValue.toLocaleString('id-ID')}` : 'Rp 0',
            change: '+12.5%',
            trend: 'up',
            icon: Wallet,
            color: '#059669',
            bg: 'bg-emerald-50/70',
            period: 'real-time',
        },
        {
            id: 'supplier',
            label: 'Total Supplier',
            value: stats ? stats.kpi.totalSuppliers.toLocaleString('id-ID') : '0',
            change: '+4.1%',
            trend: 'up',
            icon: Users,
            color: '#D97706',
            bg: 'bg-amber-50/70',
            period: 'real-time',
        },
        {
            id: 'buyer',
            label: 'Total Buyer',
            value: stats ? stats.kpi.totalBuyers.toLocaleString('id-ID') : '0',
            change: '-1.3%',
            trend: 'down',
            icon: Users,
            color: '#475569',
            bg: 'bg-slate-100/70',
            period: 'real-time',
        },
        {
            id: 'komoditas',
            label: 'Komoditas Aktif',
            value: stats ? stats.kpi.activeCommodities.toLocaleString('id-ID') : '0',
            change: '+3',
            trend: 'up',
            icon: Package,
            color: '#059669',
            bg: 'bg-emerald-50/70',
            period: 'real-time',
        },
    ];

    const activeTopCommodities = stats?.topCommodities && stats.topCommodities.length > 0 
        ? stats.topCommodities 
        : topCommodities;

    const activeRecentActivities = stats?.recentActivities && stats.recentActivities.length > 0 
        ? stats.recentActivities 
        : recentActivities;

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F8FAFC]">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Ringkasan performa platform monitoring komoditas pangan
                    </p>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl text-xs font-bold text-slate-600 border border-slate-200/60 shadow-sm self-start md:self-auto">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Sabtu, 6 Juni 2026 — 18:00 WIB
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {activeKpiData.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.id}
                            className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:border-slate-300/80 group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                </div>
                                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                                    }`}>
                                    {kpi.trend === 'up'
                                        ? <TrendingUp className="w-3.5 h-3.5" />
                                        : <TrendingDown className="w-3.5 h-3.5" />}
                                    {kpi.change}
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{kpi.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.period}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Daily Transactions Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Grafik Transaksi Harian</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Volume transaksi 7 hari terakhir</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-200/50 text-slate-600">
                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                            Minggu Ini
                        </div>
                    </div>

                    <div className="mt-8">
                        <BarChart transactions={stats?.dailyTransactions || dailyTransactions} />
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                                <span className="text-xs font-semibold text-slate-500">Volume Transaksi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                                <span className="text-xs font-semibold text-slate-400">Rata-rata Harian</span>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-800">Total: {stats ? stats.kpi.totalTransactions.toLocaleString('id-ID') : '0'} transaksi</span>
                    </div>
                </div>

                {/* Top Commodities */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Komoditas Terlaris</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Berdasarkan volume transaksi</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {activeTopCommodities.map((c: any, i: number) => (
                                <div key={c.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold w-4 text-slate-400">#{i + 1}</span>
                                            <span className="text-xs font-bold text-slate-700">{c.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-800">{c.value.toLocaleString('id-ID')} kg</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Growth Stats + Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Growth Stats */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">Statistik Pertumbuhan</h2>
                    <p className="text-xs text-slate-400 mt-0.5 mb-5">Performa platform bulan ini</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {growthStats.map((stat) => (
                            <div key={stat.label} className="rounded-xl p-4 bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-lg font-extrabold mt-1.5 leading-none" style={{ color: stat.color }}>{stat.value}</p>
                                    <p className="text-[9px] text-slate-400 mt-1 font-medium">{stat.suffix}</p>
                                </div>
                                <div className="flex items-center gap-1 mt-4">
                                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                                    <span className="text-[10px] font-bold text-emerald-600">{stat.change}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Feed (Clean Minimalist Reference Design) */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Aktivitas Terbaru</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Real-time log transaksi & logistik</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <Activity className="w-4 h-4" />
                            Live
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeRecentActivities.map((act: any) => (
                            <div
                                key={act.id}
                                className="bg-white border border-slate-200/70 rounded-2xl p-4 transition-all hover:border-slate-300 hover:shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${act.type === 'logistik' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {act.type === 'logistik'
                                                    ? <Truck className="w-3.5 h-3.5" />
                                                    : <ShoppingCart className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{act.title}</p>
                                                <span className="text-[9px] font-mono text-slate-400 font-semibold">{act.id}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={act.status} />
                                    </div>

                                    {/* Route visualizer matching reference style */}
                                    <RouteVisualizer from={act.from} to={act.to} />
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                    <span className="font-semibold text-slate-400">{act.time}</span>
                                    {act.amount && (
                                        <span className="font-extrabold text-slate-800 text-xs">{act.amount}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Info Strip - Minimalist Anchored Bar */}
            <div className="rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-6 bg-slate-900 border border-slate-800">
                <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    {[
                        { icon: MapPin, label: 'Wilayah Aktif', value: '5 Kabupaten', color: '#10B981' },
                        { icon: Package, label: 'Stok Melimpah', value: '3 Wilayah', color: '#10B981' },
                        { icon: AlertCircle, label: 'Stok Menipis', value: '2 Wilayah', color: '#F59E0B' },
                        { icon: CheckCircle2, label: 'Transaksi Hari Ini', value: '423 Selesai', color: '#059669' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80">
                                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.label}</p>
                                <p className="text-xs font-extrabold text-white mt-1 leading-none">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:block">
                    Tumbasna Core System v1.4
                </div>
            </div>
        </div>
    );
}
