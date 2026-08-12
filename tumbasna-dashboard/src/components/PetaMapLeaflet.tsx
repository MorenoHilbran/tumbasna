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
function getPinIcon(color: string) {
    if (typeof window === 'undefined' || !L || !L.divIcon) return undefined;
    return L.divIcon({
        className: 'custom-leaflet-pin-icon',
        html: `<div style="position:relative;width:30px;height:42px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0px 3px 5px rgba(0,0,0,0.3));"><svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="${color}"/><circle cx="15" cy="14" r="5" fill="white"/></svg></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -38],
    });
}

function getRegionBadgeIcon(name: string, transaksi: number, isSelected: boolean, isTinggi: boolean) {
    if (typeof window === 'undefined' || !L || !L.divIcon) return undefined;
    const bg = isSelected ? (isTinggi ? '#047857' : '#B91C1C') : (isTinggi ? '#10B981' : '#EF4444');
    const border = isSelected ? (isTinggi ? '#34D399' : '#FCA5A5') : '#FFFFFF';
    const dotColor = isTinggi ? '#6EE7B7' : '#FECDD3';

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

    const supplyPinIcon = useMemo(() => getPinIcon('#10B981'), [mounted]);
    const demandPinIcon = useMemo(() => getPinIcon('#3B82F6'), [mounted]);

    const geoJsonStyle = (feature: any) => {
        const name = feature?.properties?.name || '';
        const id = feature?.properties?.id || name.toLowerCase();
        const w = wilayahData.find(x => x.id.toLowerCase() === id.toLowerCase());
        const isTinggi = w ? (w.status === 'tinggi' || w.status === 'melimpah') : true;
        const isSelected = selected && selected.toLowerCase() === id.toLowerCase();
        const baseColor = isTinggi ? '#10B981' : '#EF4444';

        return {
            fillColor: isSelected ? (isTinggi ? '#047857' : '#B91C1C') : baseColor,
            weight: isSelected ? 3.5 : 2,
            opacity: 0.95,
            color: isSelected ? (isTinggi ? '#34D399' : '#FCA5A5') : '#FFFFFF',
            fillOpacity: isSelected ? 0.65 : 0.4,
            dashArray: isSelected ? '' : '3',
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
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-r border-slate-200/65">
                <p className="text-xs font-semibold text-slate-400">Memuat peta geografi administratif Jawa Tengah...</p>
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
                const badgeIcon = getRegionBadgeIcon(w.name, w.transaksi, isSelected, isTinggi);
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
                                    background: isSupply ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                                    color: isSupply ? '#059669' : '#2563EB',
                                    fontSize: 9, fontWeight: 700,
                                    padding: '2px 8px', borderRadius: 20,
                                    marginBottom: 6
                                }}>
                                    {isSupply ? 'SUPPLY PETANI (QRIS)' : 'DEMAND PEDAGANG (QRIS)'}
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
