'use client';

import React, { useEffect, useMemo, useState, memo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jawaTengahGeoJSON from '@/data/jawaTengahGeoJSON.json';

// ─── Types ────────────────────────────────────────────────────
interface WilayahItem {
    id: string;
    name: string;
    status: string;
    supplier: number;
    buyer: number;
    komoditas: string[];
    stok: string;
    hargaRataRata: string;
    transaksi: number;
    lat: number;
    lng: number;
    luas: number;
    radius: number;
}

interface ProductPoint {
    id: string;
    lat: number;
    lng: number;
    type: string;
    commodity: string;
    qty: number;
    location: string;
}

interface PetaMapLeafletProps {
    wilayahData: WilayahItem[];
    selected: string | null;
    onSelect: (id: string) => void;
    productPoints?: ProductPoint[];
}

// ─── Auto-pan to selected region ──────────────────────────────
function PanToSelected({ wilayahData, selected }: { wilayahData: WilayahItem[]; selected: string | null }) {
    const map = useMap();
    useEffect(() => {
        if (!selected || !map) return;
        const w = wilayahData.find(x => x.id.toLowerCase() === selected.toLowerCase());
        if (w) {
            const timer = setTimeout(() => {
                try {
                    if (map && (map as any)._loaded && map.getContainer()) {
                        map.flyTo([w.lat, w.lng], 10, { duration: 1.2 });
                    }
                } catch (e) {
                    console.warn('PanToSelected flyTo warning:', e);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selected, wilayahData, map]);
    return null;
}

// ─── Helper: Leaflet Pin Icons ────────────────────────────────
function getPinIcon(color: string, type: 'supplier' | 'buyer') {
    if (typeof window === 'undefined' || !L || !L.divIcon) return undefined;
    const isSupplier = type === 'supplier';
    const bgGrad = isSupplier ? '#F97316' : '#3B82F6'; // Warm Orange vs Royal Blue
    const darkBg = isSupplier ? '#EA580C' : '#2563EB';
    const symbol = isSupplier ? '🌾' : '🛒';

    return L.divIcon({
        className: 'custom-leaflet-pin-icon',
        html: `
        <div style="position:relative;width:34px;height:46px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0px 4px 7px rgba(0,0,0,0.35));">
            <svg width="34" height="46" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="${bgGrad}" stroke="#FFFFFF" stroke-width="1.5"/>
                <circle cx="15" cy="14" r="8.5" fill="${darkBg}"/>
            </svg>
            <div style="position:absolute;top:7px;left:0;right:0;text-align:center;font-size:11px;line-height:1;">
                ${symbol}
            </div>
        </div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 46],
        popupAnchor: [0, -42],
    });
}

function getRegionBadgeIcon(name: string, transaksi: number, isSelected: boolean, isTinggi: boolean, hasData: boolean) {
    if (typeof window === 'undefined' || !L || !L.divIcon) return undefined;

    let bg = '#64748B'; // Default Grey for No Data
    let border = '#FFFFFF';
    let dotColor = '#CBD5E1';

    if (hasData) {
        if (isTinggi) {
            bg = isSelected ? '#047857' : '#10B981';
            border = isSelected ? '#34D399' : '#FFFFFF';
            dotColor = '#6EE7B7';
        } else {
            bg = isSelected ? '#B91C1C' : '#EF4444';
            border = isSelected ? '#FCA5A5' : '#FFFFFF';
            dotColor = '#FECDD3';
        }
    } else {
        bg = isSelected ? '#334155' : '#64748B';
        border = isSelected ? '#94A3B8' : '#FFFFFF';
        dotColor = '#CBD5E1';
    }

    return L.divIcon({
        className: 'custom-region-badge-icon',
        html: `
        <div style="
            background: ${bg};
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            border: 2px solid ${border};
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-family: Poppins, sans-serif;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: all 0.2s ease;
        ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${dotColor}; display: inline-block;"></span>
            <span>${name}</span>
        </div>`,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
    });
}

// ─── Main Map Component ───────────────────────────────────────
export default memo(function PetaMapLeaflet({ wilayahData, selected, onSelect, productPoints }: PetaMapLeafletProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Initial Center & Zoom: Focused directly on Central Java / Barlingmascakeb (Zoom 9)
    const center: [number, number] = [-7.45, 109.35];

    const supplyPinIcon = useMemo(() => getPinIcon('#F97316', 'supplier'), [mounted]);
    const demandPinIcon = useMemo(() => getPinIcon('#3B82F6', 'buyer'), [mounted]);

    const geoJsonStyle = (feature: any) => {
        const name = feature?.properties?.name || '';
        const id = feature?.properties?.id || name.toLowerCase();
        const w = wilayahData.find(x => x.id.toLowerCase() === id.toLowerCase());
        
        const hasData = Boolean(w && (w.supplier > 0 || w.buyer > 0 || w.transaksi > 0));
        const isTinggi = Boolean(w && (w.status === 'tinggi' || w.status === 'melimpah'));
        const isSelected = Boolean(selected && selected.toLowerCase() === id.toLowerCase());

        let baseColor = '#94A3B8'; // Grey for no data
        let selColor = '#334155';
        let strokeColor = '#FFFFFF';

        if (hasData) {
            if (isTinggi) {
                baseColor = '#10B981';
                selColor = '#047857';
                strokeColor = isSelected ? '#34D399' : '#FFFFFF';
            } else {
                baseColor = '#EF4444';
                selColor = '#B91C1C';
                strokeColor = isSelected ? '#FCA5A5' : '#FFFFFF';
            }
        }

        return {
            fillColor: isSelected ? selColor : baseColor,
            weight: isSelected ? 3.5 : 2,
            opacity: 0.95,
            color: strokeColor,
            fillOpacity: isSelected ? 0.65 : (hasData ? 0.4 : 0.25),
            dashArray: isSelected ? '' : (hasData ? '3' : '5'),
        };
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const name = feature?.properties?.name || '';
        const id = feature?.properties?.id || name.toLowerCase();
        const w = wilayahData.find(x => x.id.toLowerCase() === id.toLowerCase());

        layer.on({
            mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({
                    fillOpacity: 0.7,
                    weight: 3,
                    color: '#10B981',
                });
            },
            mouseout: (e: any) => {
                const l = e.target;
                const isSelected = selected && selected.toLowerCase() === id.toLowerCase();
                l.setStyle(geoJsonStyle(feature));
            },
            click: () => {
                onSelect(id);
            },
        });

        if (name) {
            const trxFmt = w ? `${w.transaksi} Transaksi QRIS` : 'Potensi QRIS Tinggi';
            const popupContent = `
                <div style="font-family: Poppins, sans-serif; min-width: 150px; padding: 2px;">
                    <p style="font-weight: 800; font-size: 13px; margin: 0 0 2px; color: #0F172A;">Kabupaten ${name}</p>
                    <p style="font-size: 10px; font-weight: 700; color: #10B981; margin: 0 0 4px;">Peta Geografi Administratif</p>
                    <p style="font-size: 10px; color: #475569; margin: 0;">${trxFmt}</p>
                    ${w ? `<p style="font-size: 9px; color: #94A3B8; margin-top: 4px;">Supplier: ${w.supplier} &bull; Buyer: ${w.buyer}</p>` : ''}
                </div>
            `;
            layer.bindPopup(popupContent, { offset: [0, -10] });
        }
    };

    if (!mounted) {
        return (
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
        );
    }

    return (
        <MapContainer
            key="tumbasna-leaflet-map-root"
            center={center}
            zoom={9}
            maxBounds={[[-12.0, 94.0], [8.0, 142.5]]}
            maxBoundsViscosity={1.0}
            minZoom={7}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
        >
            {/* Tile Layer — Clean OpenStreetMap Terrain */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
            />

            {/* Auto-pan saat wilayah dipilih */}
            <PanToSelected wilayahData={wilayahData} selected={selected} />

            {/* 1. Administrative Boundaries (GeoJSON Polygons for Jawa Tengah Kabupaten) */}
            {jawaTengahGeoJSON && (
                <GeoJSON
                    key={JSON.stringify(selected)}
                    data={jawaTengahGeoJSON as any}
                    style={geoJsonStyle}
                    onEachFeature={onEachFeature}
                />
            )}

            {/* 2. Region Center Badges (Badges for transaction volume) */}
            {wilayahData.map((w) => {
                const isSelected = selected?.toLowerCase() === w.id.toLowerCase();
                const isTinggi = w.status === 'tinggi' || w.status === 'melimpah';
                const hasData = w.supplier > 0 || w.buyer > 0 || w.transaksi > 0;
                const badgeIcon = getRegionBadgeIcon(w.name, w.transaksi, isSelected, isTinggi, hasData);
                if (!badgeIcon) return null;

                return (
                    <Marker
                        key={`badge-${w.id}`}
                        position={[w.lat, w.lng]}
                        icon={badgeIcon}
                        eventHandlers={{ click: () => onSelect(w.id) }}
                    >
                        <Tooltip direction="top" offset={[0, -15]} opacity={0.95}>
                            <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2px 4px' }}>
                                <p style={{ fontWeight: 800, fontSize: '12px', margin: 0, color: '#0F172A' }}>{w.name}</p>
                                <p style={{ fontSize: '10px', margin: 0, color: isTinggi ? '#059669' : '#6366F1', fontWeight: 700 }}>
                                    {w.transaksi} Transaksi QRIS
                                </p>
                                <p style={{ fontSize: '9px', margin: 0, color: '#64748B', fontWeight: 500 }}>
                                    Supplier: {w.supplier} | Buyer: {w.buyer}
                                </p>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}

            {/* 3. Product Supply & Demand Pins */}
            {productPoints?.map((p) => {
                const isSupply = p.type === 'SUPPLY';
                const pinIcon = isSupply ? supplyPinIcon : demandPinIcon;
                if (!pinIcon) return null;

                return (
                    <Marker
                        key={`prod-${p.id}`}
                        position={[p.lat, p.lng]}
                        icon={pinIcon}
                    >
                        <Popup offset={[0, -36]}>
                            <div style={{ fontFamily: 'Poppins, sans-serif', minWidth: '160px', padding: '4px' }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 4 }}>
                                    {p.commodity}
                                </div>
                                <div style={{
                                    display: 'inline-block',
                                    background: isSupply ? 'rgba(249,115,22,0.12)' : 'rgba(59,130,246,0.12)',
                                    color: isSupply ? '#C2410C' : '#2563EB',
                                    fontSize: 9, fontWeight: 700,
                                    padding: '2px 8px', borderRadius: 20,
                                    marginBottom: 6
                                }}>
                                    {isSupply ? '🌾 SUPPLY PETANI (PRODUSEN)' : '🛒 DEMAND PEDAGANG (BUYER)'}
                                </div>
                                <div style={{ fontSize: 11, color: '#475569', margin: '3px 0' }}>
                                    <strong>Volume:</strong> {p.qty} kg
                                </div>
                                <div style={{ fontSize: 11, color: '#475569', margin: '3px 0' }}>
                                    <strong>Lokasi:</strong> {p.location}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
});
