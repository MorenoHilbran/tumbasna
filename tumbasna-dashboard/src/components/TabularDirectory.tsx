"use client";

import { ListFilter } from "lucide-react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

// Defining a prop type that matches the groupedPoints structure from the server component
type TabularDirectoryProps = {
    groupedPoints: Record<string, { supply: any[]; demand: any[] }>;
    sortedRegions: string[];
    lang: "id" | "en";
};

const dict = {
    id: {
        title: "Laporan Konsolidasi per Wilayah",
        desc: "Detail pasokan surplus dan defisit yang dikategorikan berdasarkan Pulau / Provinsi.",
        emptyDir: "Belum ada data wilayah tercatat.",
        tabSubDesc: "Laporan rinci rantai pasok level regional.",
        colSurplusTitle: "Titik Surplus Petani",
        colSurplusEmpty: "Tidak terdeteksi pelaporan titik panen/surplus di wilayah ini.",
        colDeficitTitle: "Titik Defisit Pasar (UMKM)",
        colDeficitEmpty: "Tidak terdeteksi pasar yang sedang mencari komoditas di wilayah ini."
    },
    en: {
        title: "Consolidated Regional Report",
        desc: "Details of surplus supply and deficit categorized by Island / Province.",
        emptyDir: "No regional data recorded yet.",
        tabSubDesc: "Detailed supply chain report at the regional level.",
        colSurplusTitle: "Farmer Surplus Points",
        colSurplusEmpty: "No harvest/surplus reports detected in this region.",
        colDeficitTitle: "Market Deficit Points (MSME)",
        colDeficitEmpty: "No markets currently seeking commodities detected in this region."
    }
};

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function TabularDirectory({ groupedPoints, sortedRegions, lang }: TabularDirectoryProps) {
    const t = dict[lang];

    return (
        <div className="mt-8 pt-6 border-t border-slate-200 font-sans">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                        <ListFilter className="w-5 h-5 text-emerald-600" />
                        {t.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{t.desc}</p>
                </div>
            </div>

            {sortedRegions.length === 0 ? (
                <div className="p-12 border border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <ListFilter className="w-8 h-8 opacity-50 text-emerald-300" />
                    </div>
                    <p className="text-base font-bold text-slate-600">{t.emptyDir}</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <TabGroup>
                        {/* Scrollable Tab Headers */}
                        <div className="bg-slate-50/50 border-b border-slate-100 p-2">
                            <TabList className="flex space-x-2 overflow-x-auto scrollbar-none pb-0.5 snap-x px-2">
                                {sortedRegions.map((region) => {
                                    const totalSp = groupedPoints[region].supply.length;
                                    const totalDm = groupedPoints[region].demand.length;
                                    return (
                                        <Tab
                                            key={region}
                                            className={({ selected }) =>
                                                classNames(
                                                    "snap-start shrink-0 min-w-max px-5 py-3 rounded-xl text-xs font-bold border transition-all duration-300 outline-none flex items-center gap-3",
                                                    selected
                                                        ? "bg-white text-emerald-600 border-emerald-200 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/10 z-10"
                                                        : "bg-transparent text-slate-400 border-transparent hover:bg-white hover:text-slate-600 hover:border-slate-200 shadow-none"
                                                )
                                            }
                                        >
                                            {region}
                                            <div className="flex gap-1.5">
                                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[8px] font-bold bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">{totalSp}</span>
                                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-[8px] font-bold bg-red-50 text-red-600 rounded-md border border-red-100">{totalDm}</span>
                                            </div>
                                        </Tab>
                                    );
                                })}
                            </TabList>
                        </div>

                        {/* Tab Content Areas */}
                        <TabPanels className="flex-1 overflow-hidden p-6 bg-white">
                            {sortedRegions.map((region) => (
                                <TabPanel
                                    key={region}
                                    className="h-full focus:outline-none animate-in fade-in slide-in-from-bottom-1 duration-500"
                                >
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{region}</h3>
                                            <p className="text-[12px] text-slate-400 mt-1 font-medium">{t.tabSubDesc}</p>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[12px] font-bold text-slate-400 mb-1">Surplus</p>
                                                <p className="text-xl font-bold text-emerald-600">{groupedPoints[region].supply.length}</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-100"></div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-bold text-slate-400 mb-1">Deficit</p>
                                                <p className="text-xl font-bold text-red-500">{groupedPoints[region].demand.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Supply Column */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-emerald-200 transition-all duration-300">
                                            <div className="bg-emerald-50/10 px-6 py-3 border-b border-slate-50 flex items-center justify-between group-hover:bg-emerald-50 transition-colors">
                                                <h4 className="text-[10px] font-bold text-emerald-700 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span> {t.colSurplusTitle}
                                                </h4>
                                            </div>
                                            <div className="p-2">
                                                {groupedPoints[region].supply.length === 0 ? (
                                                    <div className="px-6 py-12 text-center text-slate-300 text-[10px] font-bold italic bg-slate-50/50 rounded-xl">
                                                        {t.colSurplusEmpty}
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-none pr-1">
                                                        {groupedPoints[region].supply.map((sp: any, i: number) => (
                                                            <li key={i} className="flex justify-between items-center text-sm py-3 px-4 rounded-xl hover:bg-emerald-50/50 transition-all group/item border border-transparent hover:border-emerald-100 relative overflow-hidden">
                                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                                 <div className="w-[40%] running-text-container">
                                                                    <span className="font-bold text-slate-800 capitalize pr-2 group-hover/item:text-emerald-700 transition-colors running-text-content" title={sp.commodity}>{sp.commodity}</span>
                                                                 </div>
                                                                <span className="text-emerald-600 font-bold px-3 py-1 shadow-sm text-center bg-white rounded-lg border border-emerald-100 text-xs w-20">{sp.qty} kg</span>
                                                                 <div className="w-[35%] running-text-container text-right">
                                                                    <span className="text-slate-400 text-xs font-bold running-text-content" title={sp.location}>{sp.location.split(',')[0]}</span>
                                                                 </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>

                                        {/* Demand Column */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-red-200 transition-all duration-300">
                                            <div className="bg-red-50/10 px-6 py-3 border-b border-slate-50 flex items-center justify-between group-hover:bg-red-50 transition-colors">
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-700 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/30"></span> {t.colDeficitTitle}
                                                </h4>
                                            </div>
                                            <div className="p-2">
                                                {groupedPoints[region].demand.length === 0 ? (
                                                    <div className="px-6 py-12 text-center text-slate-300 text-[10px] font-bold italic uppercase tracking-widest bg-slate-50/50 rounded-xl">
                                                        {t.colDeficitEmpty}
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-none pr-1">
                                                        {groupedPoints[region].demand.map((dm: any, i: number) => (
                                                             <li key={i} className="flex justify-between items-center text-sm py-3 px-4 rounded-xl hover:bg-red-50/50 transition-all group/item border border-transparent hover:border-red-100 relative overflow-hidden">
                                                                 <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                                 <div className="w-[40%] running-text-container">
                                                                    <span className="font-bold text-slate-800 capitalize pr-2 group-hover/item:text-red-700 transition-colors running-text-content" title={dm.commodity}>{dm.commodity}</span>
                                                                 </div>
                                                                 <span className="text-red-500 font-bold px-3 py-1 shadow-sm text-center bg-white rounded-lg border border-red-100 text-xs w-20">{dm.qty} kg</span>
                                                                 <div className="w-[35%] running-text-container text-right">
                                                                    <span className="text-slate-400 text-xs font-bold running-text-content" title={dm.location}>{dm.location.split(',')[0]}</span>
                                                                 </div>
                                                             </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </TabGroup>
                </div>
            )}
        </div>
    );
}
