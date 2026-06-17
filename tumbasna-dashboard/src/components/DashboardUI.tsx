"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { MapPin, TrendingUp, Activity, PackageCheck, AlertTriangle, Truck, LineChart, ShieldCheck, Info, ListFilter, Languages } from "lucide-react";
import TabularDirectory from "@/components/TabularDirectory";

// Use next/dynamic since leaflet interacts with windows object directly
const DynamicMapComponent = dynamic(
    () => import("@/components/MapComponent"),
    {
        ssr: false,
        loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-slate-50 animate-pulse rounded-2xl border border-slate-100"><Activity className="text-slate-300 w-8 h-8 animate-spin" /></div>
    }
);

const dict = {
    id: {
        title: "TPID",
        subtitle: "Platform Monitoring",
        desc: "Analitik Pangan Bergejolak",
        syncText: "Tersinkronisasi Webhook AI",
        activeText: "Aktif",
        execTitle: "Ringkasan Eksekutif",
        execDesc: "Pemantauan real-time untuk pencocokan surplus dan defisit wilayah.",
        c1Title: "Pasokan Surplus",
        c1Unit: "titik",
        c1Hover: "Titik wilayah tempat petani/desa yang mengalami kelebihan hasil panen dan siap didistribusikan.",
        c2Title: "Defisit Permintaan",
        c2Unit: "titik",
        c2Hover: "Titik pasar / UMKM yang sedang kekurangan komoditas atau menghadapi lonjakan harga tengkulak.",
        c3Title: "Transaksi Cerdas",
        c3Unit: "selesai",
        c3Hover: "Volume transaksi yang secara otomatis berhasil dipertemukan oleh AI berdasarkan kecocokan parameter algoritma.",
        c4Title: "Efisiensi Logistik",
        c4Unit: "Hemat",
        c4Hover: "Persentase penghematan ongkos kirim hasil optimalisasi Truk Balikan (Backhaul) yang mendistribusikan pangan searah rute logistik.",
        mapTitle: "Peta Sebaran Surplus/Defisit",
        mapDesc: "Pelacakan langsung posisi geolokasi petani riil dan pasar rakyat (UMKM).",
        mapBadgeSup: "Wilayah Surplus",
        mapBadgeDef: "Wilayah Defisit",
        logTitle: "Log Mesin Pencocokan",
        logDesc: "Status intervensi pasar otomatis berbasis Rute Backhaul.",
        logEmpty: "Belum ada intersept pasar terjadi.",
        logEmptySub: "Mengawasi entri baru dari Bot WhatsApp.",
        logOrigin: "Asal (Pasokan Petani)",
        logDest: "Tujuan (Pasar / UMKM)",
        logSol: "Solusi Harga Pasar",
        logBackhaul: "Rute Backhaul"
    },
    en: {
        title: "TPID",
        subtitle: "Monitoring Platform",
        desc: "Volatile Food Analytics",
        syncText: "Synced via AI Webhook",
        activeText: "Active",
        execTitle: "Executive Summary",
        execDesc: "Real-time monitoring for regional surplus and deficit matching.",
        c1Title: "Surplus Supply",
        c1Unit: "points",
        c1Hover: "Regional points where farmers/villages experience harvest surplus ready for distribution.",
        c2Title: "Demand Deficit",
        c2Unit: "points",
        c2Hover: "Market / MSME points currently lacking commodities or facing middlemen price spikes.",
        c3Title: "Smart Matches",
        c3Unit: "cleared",
        c3Hover: "Transaction volume successfully and automatically matched by AI based on algorithm parameters.",
        c4Title: "Logistics Efficiency",
        c4Unit: "Saved",
        c4Hover: "Estimated percentage of shipping cost savings from Backhaul optimization distributing food one-way.",
        mapTitle: "Surplus/Deficit Distribution Map",
        mapDesc: "Live geolocation tracking of real farmers and traditional markets (MSMEs).",
        mapBadgeSup: "Surplus Region",
        mapBadgeDef: "Deficit Region",
        logTitle: "Matching Engine Logs",
        logDesc: "Automated market intervention status based on Backhaul Routing.",
        logEmpty: "No market intercepts occurred yet.",
        logEmptySub: "Monitoring new entries from WhatsApp Bot.",
        logOrigin: "Origin (Farmer Supply)",
        logDest: "Destination (Market / MSME)",
        logSol: "Market Price Fix",
        logBackhaul: "Backhaul Route"
    }
};

type DashboardUIProps = {
    points: any[];
    supplyCount: number;
    demandCount: number;
    recentMatches: any[];
    totalMatchesCount: number;
    groupedPoints: Record<string, { supply: any[]; demand: any[] }>;
    sortedRegions: string[];
    efficiency: number;
};

export default function DashboardUI({ points, supplyCount, demandCount, recentMatches, totalMatchesCount, groupedPoints, sortedRegions, efficiency }: DashboardUIProps) {
    const [lang, setLang] = useState<"en" | "id">("id");
    const t = dict[lang];

    const toggleLang = () => {
        setLang(prev => prev === "id" ? "en" : "id");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
            {/* Top Command Center Nav */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                                {t.title} <span className="text-blue-600">{t.subtitle}</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">{t.desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleLang}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <Languages className="w-3.5 h-3.5 text-blue-500" />
                            {lang === "id" ? "ID \u2192 EN" : "EN \u2192 ID"}
                        </button>
                        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            {t.syncText}
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {t.activeText}
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-6 mt-2 space-y-6">
                {/* Executive Summary row */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.execTitle}</h2>
                    <p className="text-[13px] text-slate-500 font-medium">{t.execDesc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                                    <PackageCheck className="w-5 h-5" />
                                </div>
                                <div className="relative group/tooltip">
                                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                     <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[10px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                         {t.c1Hover}
                                     </div>
                                </div>
                            </div>
                             <p className="text-xs font-bold text-slate-400 mb-1">{t.c1Title}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{supplyCount} <span className="text-xs font-medium text-slate-300 ml-1">{t.c1Unit}</span></h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="relative group/tooltip">
                                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                    <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[9px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                        {t.c2Hover}
                                    </div>
                                </div>
                            </div>
                             <p className="text-xs font-bold text-slate-400 mb-1">{t.c2Title}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{demandCount} <span className="text-xs font-medium text-slate-300 ml-1">{t.c2Unit}</span></h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div className="relative group/tooltip">
                                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                    <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[9px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                        {t.c3Hover}
                                    </div>
                                </div>
                            </div>
                             <p className="text-xs font-bold text-slate-400 mb-1">{t.c3Title}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{totalMatchesCount} <span className="text-xs font-medium text-slate-300 ml-1">{t.c3Unit}</span></h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all duration-300">
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div className="relative group/tooltip">
                                    <Info className="w-3.5 h-3.5 text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
                                    <div className="absolute top-6 right-0 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 bg-slate-900 text-white text-[9px] font-bold leading-relaxed p-3 rounded-xl shadow-xl z-[100] pointer-events-none border border-slate-800">
                                        {t.c4Hover}
                                    </div>
                                </div>
                            </div>
                             <p className="text-xs font-bold text-slate-400 mb-1">{t.c4Title}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{efficiency}<span className="text-xs font-bold text-slate-300">%</span> <span className="text-xs font-bold text-emerald-600 ml-1">{t.c4Unit}</span></h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* TPID Heatmap/Hotspot Map */}
                    <div className="xl:col-span-2 flex flex-col">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        {t.mapTitle}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">{t.mapDesc}</p>
                                </div>
                                <div className="hidden sm:flex space-x-4 text-[11px] font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
                                    <div className="flex items-center text-slate-600"><span className="w-2 rounded-full bg-emerald-500 mr-2 aspect-square"></span> {t.mapBadgeSup}</div>
                                    <div className="flex items-center text-slate-600"><span className="w-2 rounded-full bg-red-500 mr-2 aspect-square"></span> {t.mapBadgeDef}</div>
                                </div>
                            </div>
                            <div className="p-2 w-full h-[650px] bg-white relative z-0">
                                <Suspense fallback={<div className="w-full h-full flex justify-center items-center"><Activity className="animate-spin text-slate-300" /></div>}>
                                    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-100">
                                        <DynamicMapComponent points={points as any} />
                                    </div>
                                </Suspense>
                            </div>
                        </div>
                    </div>

                    {/* AI Smart Matches Flow */}
                    <div className="flex flex-col h-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex-1 flex flex-col overflow-hidden max-h-[740px]">
                            <div className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    {t.logTitle}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{t.logDesc}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200 z-0 bg-slate-50/10">
                                {recentMatches.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-sm text-slate-400">
                                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                            <Activity className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="font-bold text-slate-600">{t.logEmpty}</p>
                                        <p className="text-xs mt-1 text-slate-400">{t.logEmptySub}</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-4">
                                        {recentMatches.map((match) => (
                                            <li key={match.id} className="p-4 rounded-xl border border-slate-200/60 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50 group-hover:scale-105 transition-transform">
                                                            <PackageCheck className="w-5 h-5" />
                                                        </div>
                                                         <div>
                                                             <div className="running-text-container">
                                                                 <span className="font-bold text-slate-900 block leading-tight tracking-tight text-sm running-text-content">
                                                                     {match.supplyEntry.commodity}
                                                                 </span>
                                                             </div>
                                                             <div className="flex items-center gap-2 mt-1">
                                                                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                                                                     {match.supplyEntry.qty} kg
                                                                 </span>
                                                                 <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/50">
                                                                     Rp {(match.supplyEntry.price || match.demandEntry.price).toLocaleString('id-ID')}
                                                                 </span>
                                                             </div>
                                                         </div>
                                                    </div>
                                                     <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg border bg-blue-50 text-blue-700 border-blue-200">
                                                         {match.status}
                                                     </span>
                                                </div>

                                                <div className="relative pl-3 mt-2 border-l-2 border-slate-100 ml-5 space-y-5 py-1">
                                                    {/* Supply Node */}
                                                     <div className="relative">
                                                         <span className="absolute -left-[19.5px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm border border-emerald-100"></span>
                                                         <p className="text-[10px] font-bold text-slate-400 mb-0.5">{t.logOrigin}</p>
                                                        <p className="font-bold text-slate-800 text-xs truncate">{match.supplyEntry.user.name || match.supplyEntry.user.phoneNumber}</p>
                                                         <div className="running-text-container">
                                                             <p className="text-[12px] text-slate-500 mt-0.5 font-medium running-text-content">{match.supplyEntry.location}</p>
                                                         </div>
                                                     </div>

                                                    {/* Demand Node */}
                                                     <div className="relative">
                                                         <span className="absolute -left-[19.5px] top-1.5 w-3 h-3 rounded-full bg-red-500 ring-4 ring-white shadow-sm border border-red-100"></span>
                                                         <p className="text-[10px] font-bold text-slate-400 mb-0.5">{t.logDest}</p>
                                                        <p className="font-bold text-slate-800 text-xs truncate">{match.demandEntry.user.name || match.demandEntry.user.phoneNumber}</p>
                                                         <div className="running-text-container">
                                                             <p className="text-[12px] text-slate-500 mt-0.5 font-medium running-text-content">{match.demandEntry.location}</p>
                                                         </div>
                                                     </div>
                                                </div>

                                                 <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                     <span className="flex items-center gap-1.5 text-emerald-600 px-2 py-0.5 rounded-lg bg-emerald-50/30 font-bold"><TrendingUp className="w-3 h-3" /> {t.logSol}</span>
                                                     <span className="text-blue-600 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50/30 font-bold">{t.logBackhaul} <Truck className="w-3 h-3" /></span>
                                                 </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabular List Directory Section */}
                <TabularDirectory groupedPoints={groupedPoints} sortedRegions={sortedRegions} lang={lang} />

            </main>
        </div>
    );
}
