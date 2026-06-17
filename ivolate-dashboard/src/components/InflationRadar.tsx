'use client';

import { useState } from 'react';
import { AlertTriangle, TrendingDown, MapPin, Calendar, Activity, Info } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AlertLevel = 'critical' | 'warning' | 'watch';

export type AlertRegion = {
    city: string;
    commodity: string;
    deficit: number;
    date: string;
    level: AlertLevel;
    trend: number;
};

export type InflationData = {
    timeSeries: Record<string, { historical: number[]; predicted: number[] }>;
    alertRegions: AlertRegion[];
    commodities: string[];
};

type Props = {
    data: InflationData;
};

// ─────────────────────────────────────────────
// SVG Line Chart Helper
// ─────────────────────────────────────────────

function buildPolylinePoints(
    values: number[],
    viewW: number,
    viewH: number,
    minVal: number,
    maxVal: number,
    offsetX = 0,
): string {
    const range = maxVal - minVal || 1;
    return values
        .map((v, i) => {
            const x = offsetX + (i / (values.length - 1)) * (viewW - offsetX);
            const y = viewH - ((v - minVal) / range) * viewH;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
}

function LineChart({
    historical,
    predicted,
}: {
    historical: number[];
    predicted: number[];
}) {
    const W = 600;
    const H = 180;
    const PAD = 40; // left padding for Y-axis labels

    const allValues = [...historical, ...predicted];
    const minVal = Math.min(...allValues) - 100;
    const maxVal = Math.max(...allValues) + 100;

    // Historical spans full width but only its portion
    const histW = W - PAD;
    const histPoints = historical.map((v, i) => {
        const x = PAD + (i / (historical.length - 1)) * histW * (historical.length / (historical.length + predicted.length - 1));
        const y = H - ((v - minVal) / (maxVal - minVal)) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const totalPoints = historical.length + predicted.length - 1; // last historical = first predicted
    const allPoints = [...historical, ...predicted.slice(1)];
    const fullPoints = allPoints.map((v, i) => {
        const x = PAD + (i / (totalPoints - 1)) * (W - PAD);
        const y = H - ((v - minVal) / (maxVal - minVal)) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const predStart = historical.length - 1;
    const predPoints = allPoints.slice(predStart).map((v, i) => {
        const x = PAD + ((predStart + i) / (totalPoints - 1)) * (W - PAD);
        const y = H - ((v - minVal) / (maxVal - minVal)) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Area gradient for historical
    const areaHistPoints = [
        histPoints[0].replace(/,[\d.]+$/, `,${H}`),
        ...histPoints,
        histPoints[histPoints.length - 1].replace(/,[\d.]+$/, `,${H}`),
    ].join(' ');

    // Y-axis ticks
    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
        Math.round(minVal + (i / ticks) * (maxVal - minVal))
    );

    // X-axis labels: show D-30, D-20, D-10, Today, D+7, D+14
    const today = historical.length - 1;
    const xLabels = [
        { idx: 0, label: 'H-30' },
        { idx: Math.floor(today / 3), label: `H-${today - Math.floor(today / 3)}` },
        { idx: Math.floor((2 * today) / 3), label: `H-${today - Math.floor((2 * today) / 3)}` },
        { idx: today, label: 'Hari Ini' },
        { idx: today + 7, label: 'H+7' },
        { idx: today + 13, label: 'H+14' },
    ];

    return (
        <svg
            viewBox={`0 -10 ${W} ${H + 40}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                {/* Historical area gradient */}
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
                {/* Prediction area gradient */}
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
                {/* Glow filter */}
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Grid lines */}
            {yTicks.map((tick, i) => {
                const y = H - ((tick - minVal) / (maxVal - minVal)) * H;
                return (
                    <g key={i}>
                        <line
                            x1={PAD} y1={y} x2={W} y2={y}
                            stroke="#1e293b" strokeWidth="1"
                        />
                        <text
                            x={PAD - 4} y={y + 4}
                            textAnchor="end"
                            fontSize="9"
                            fill="#475569"
                        >
                            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                        </text>
                    </g>
                );
            })}

            {/* Today vertical divider */}
            {(() => {
                const x = PAD + (today / (totalPoints - 1)) * (W - PAD);
                return (
                    <line
                        x1={x} y1={-10} x2={x} y2={H + 10}
                        stroke="#334155" strokeWidth="1" strokeDasharray="4 3"
                    />
                );
            })()}

            {/* Historical area */}
            <polygon points={areaHistPoints} fill="url(#histGrad)" />

            {/* Historical line */}
            <polyline
                points={histPoints.join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#glow)"
            />

            {/* Prediction area */}
            {(() => {
                const predAreaPoints = [
                    predPoints[0].replace(/,[\d.]+$/, `,${H}`),
                    ...predPoints,
                    predPoints[predPoints.length - 1].replace(/,[\d.]+$/, `,${H}`),
                ].join(' ');
                return <polygon points={predAreaPoints} fill="url(#predGrad)" />;
            })()}

            {/* Prediction dashed line */}
            <polyline
                points={predPoints.join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeLinejoin="round"
                strokeLinecap="round"
            />

            {/* Dot at today */}
            {(() => {
                const x = PAD + (today / (totalPoints - 1)) * (W - PAD);
                const y = H - ((historical[today] - minVal) / (maxVal - minVal)) * H;
                return (
                    <>
                        <circle cx={x} cy={y} r="5" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                        <circle cx={x} cy={y} r="3" fill="#06b6d4" />
                    </>
                );
            })()}

            {/* X-axis labels */}
            {xLabels.map(({ idx, label }) => {
                if (idx >= totalPoints) return null;
                const x = PAD + (idx / (totalPoints - 1)) * (W - PAD);
                return (
                    <text key={idx} x={x} y={H + 22} textAnchor="middle" fontSize="9" fill="#475569">
                        {label}
                    </text>
                );
            })}
        </svg>
    );
}

// ─────────────────────────────────────────────
// Alert level config
// ─────────────────────────────────────────────

const LEVEL_CONFIG: Record<AlertLevel, { label: string; bg: string; text: string; dot: string; ring: string }> = {
    critical: {
        label: 'KRITIS',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        dot: 'bg-red-500',
        ring: 'border-red-500/30',
    },
    warning: {
        label: 'WASPADA',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        ring: 'border-amber-500/30',
    },
    watch: {
        label: 'PANTAU',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        dot: 'bg-yellow-400',
        ring: 'border-yellow-500/30',
    },
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function InflationRadar({ data }: Props) {
    const commodities = data.commodities.length > 0 ? data.commodities : ['Bawang Merah'];
    const [selected, setSelected] = useState(commodities[0]);
    const series = data.timeSeries[selected] || { historical: [], predicted: [] };

    const criticalCount = data.alertRegions.filter(r => r.level === 'critical').length;
    const warningCount = data.alertRegions.filter(r => r.level === 'warning').length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6">
            {/* ── Header ── */}
            <div className="mb-6">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Activity className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-blue-600/60">
                        Bank Indonesia · Sistem Peringatan Dini
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Radar Inflasi&nbsp;
                    <span className="text-blue-600">
                        AI Predictive
                    </span>
                </h1>
                <p className="text-base text-slate-500 mt-2 font-medium max-w-2xl leading-relaxed">
                    Prediksi defisit komoditas pangan 14 hari ke depan berdasarkan tren pasokan historis.
                </p>
            </div>

            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Wilayah Kritis', value: criticalCount, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', tooltip: 'Wilayah yang memiliki rasio defisit pangan > 80% (Demand vs Supply).' },
                    { label: 'Wilayah Waspada', value: warningCount, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tooltip: 'Wilayah yang menunjukkan tren penurunan pasokan > 20% dlm 7 hari.' },
                    { label: 'Komoditas Dipantau', value: commodities.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tooltip: 'Jumlah jenis bahan pokok yang masuk dalam sistem monitoring AI.' },
                ].map(kpi => (
                    <div
                        key={kpi.label}
                        className={`rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col items-start transition-all hover:shadow-md`}
                    >
                        <div className="flex items-center justify-between w-full mb-3">
                            <div className={`px-2.5 py-1 rounded-lg ${kpi.bg} ${kpi.color} text-xs font-bold border ${kpi.border}`}>
                                {kpi.label}
                            </div>
                            <div className="relative group/tooltip">
                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                    {kpi.tooltip}
                                </div>
                            </div>
                        </div>
                        <p className={`text-3xl font-bold text-slate-900`}>{kpi.value.toString().padStart(2, '0')}</p>
                    </div>
                ))}
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* ── Chart Panel (3/5) ── */}
                <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    {/* Chart header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-start gap-2">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tren Pasokan & Prediksi Defisit</h2>
                                <p className="text-[13px] text-slate-500 mt-0.5 font-medium">30 hari historis + 14 hari proyeksi (kg)</p>
                            </div>
                            <div className="relative group/tooltip mt-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                <div className="absolute top-6 left-0 w-56 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                    Dihitung menggunakan regresi linear dari data pasokan harian petani untuk mendeteksi potensi kelangkaan barang.
                                </div>
                            </div>
                        </div>

                        {/* Commodity selector */}
                        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {commodities.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setSelected(c)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${selected === c
                                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                        : 'bg-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">Pasokan Historis</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">Prediksi 14 Hari</span>
                        </div>
                    </div>

                    {/* SVG Chart */}
                    <div className="h-56 relative bg-slate-50/20 rounded-xl border border-slate-100 p-3">
                        <LineChart
                            historical={series.historical}
                            predicted={series.predicted}
                        />
                    </div>

                    {/* Bottom annotation */}
                    <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-4 h-4 text-orange-600" />
                        </div>
                        <p className="text-sm text-orange-800 font-medium">
                            Model memproyeksikan penurunan pasokan <span className="font-bold underline">{selected}</span> sebesar{' '}
                            <span className="text-base font-bold italic">
                                {Math.round(
                                    ((series.historical[series.historical.length - 1] - series.predicted[series.predicted.length - 1]) /
                                        series.historical[series.historical.length - 1]) *
                                    100
                                )}
                                %
                            </span>{' '}
                            dalam 14 hari ke depan.
                        </p>
                    </div>
                </div>

                {/* ── Alert Panel (2/5) ── */}
                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-red-100">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                </div>
                                Daerah Rawan Inflasi
                            </h2>
                            <p className="text-[13px] text-slate-500 mt-0.5 font-medium">High Alert · Updated Auto</p>
                        </div>
                        {/* Blinking dot */}
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-md shadow-red-500/50" />
                        </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 max-h-[400px]">
                        {data.alertRegions.map((region, idx) => {
                            const cfg = LEVEL_CONFIG[region.level];
                            const lightCfg = {
                                critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' },
                                warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
                                watch: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
                            }[region.level];

                            return (
                                <div
                                    key={idx}
                                    className={`rounded-xl border ${lightCfg.border} ${lightCfg.bg} p-3.5 flex items-start gap-3 transition-all hover:scale-[1.01] cursor-default`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <span className={`inline-flex w-2.5 h-2.5 rounded-full ${lightCfg.dot} shadow-sm`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                <span className="text-[13px] font-bold text-slate-900 truncate">
                                                    {region.city}
                                                </span>
                                            </div>
                                            <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded-md ${lightCfg.bg} ${lightCfg.text} border ${lightCfg.border}`}>
                                                {cfg.label}
                                            </span>
                                        </div>

                                        <p className="text-[13px] text-slate-600 font-medium">
                                            Defisit <span className="font-bold text-slate-900">{region.commodity}</span>:
                                            <span className={`font-bold ml-1 ${lightCfg.text}`}>
                                                {region.deficit.toLocaleString('id-ID')} kg
                                            </span>
                                        </p>

                                        <div className="flex items-center gap-3 mt-2.5">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <Calendar className="w-3 h-3 text-blue-500" />
                                                {region.date}
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-bold bg-white/80 px-2 py-0.5 rounded-full border border-slate-100">
                                                <TrendingDown className={`w-3 h-3 ${lightCfg.text}`} />
                                                <span className={lightCfg.text}>{region.trend}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary footer */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-xs font-bold text-slate-400">{criticalCount} Kritis</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-slate-400">{warningCount} Waspada</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


