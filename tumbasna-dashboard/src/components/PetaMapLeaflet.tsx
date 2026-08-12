'use client';

import React, { useEffect, useMemo, useState, memo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// ─── Auto-pan to selected marker ─────────────────────────────
function PanToSelected({ wilayahData, selected }: { wilayahData: WilayahItem[]; selected: string | null }) {
    const map = useMap();
    useEffect(() => {
        if (!selected || !map) return;
        const w = wilayahData.find(x => x.id === selected);
        if (w) {
            const timer = setTimeout(() => {
                try {
                    if (map && (map as any)._loaded && map.getContainer()) {
                        map.flyTo([w.lat, w.lng], 10, { duration: 1.2 });
                    }
                } catch (e) {
                    console.warn('PanToSelected flyTo warning:', e);
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [selected, wilayahData, map]);
    return null;
}

// ─── Helper: Create Leaflet Pin Icon ─────────────────────────
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

// ─── Main Map Component ───────────────────────────────────────
export default memo(function PetaMapLeaflet({ wilayahData, selected, onSelect, productPoints }: PetaMapLeafletProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Center: tengah Barlingmascakeb & Tegal
    const center: [number, number] = [-7.25, 109.30];

    const supplyPinIcon = useMemo(() => getPinIcon('#48BB78'), [mounted]);
    const demandPinIcon = useMemo(() => getPinIcon('#3182CE'), [mounted]);

    if (!mounted) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-r border-slate-200/65">
                <p className="text-xs font-semibold text-slate-400">Memuat peta interaktif...</p>
            </div>
        );
    }

    return (
        <MapContainer
            key="tumbasna-leaflet-map-root"
            center={center}
            zoom={8}
            maxBounds={[[-12.0, 94.0], [8.0, 142.5]]}
            maxBoundsViscosity={1.0}
            minZoom={5}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
        >
            {/* Tile Layer — Google Satellite Hybrid */}
            <TileLayer
                attribution='&copy; <a href="https://maps.google.com">Google Maps</a> Satellite'
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                maxZoom={20}
            />

            {/* Auto-pan saat marker dipilih dari footer */}
            <PanToSelected wilayahData={wilayahData} selected={selected} />

            {/* Markers per wilayah (Ukuran lingkaran proporsional dengan Luas Wilayah km²) */}
            {wilayahData.map((w) => {
                const isTinggi = w.status === 'tinggi' || w.status === 'melimpah';
                const isSelected = selected === w.id;
                const fillColor = isTinggi ? '#10B981' : '#F43F5E';
                const fillOpacity = isSelected ? 0.8 : 0.5;
                const strokeColor = isTinggi ? '#059669' : '#E11D48';

                // Hitung radius proporsional berdasarkan Luas Wilayah (700 km² - 2200 km²)
                const minLuas = 700;
                const maxLuas = 2200;
                const minR = 18;
                const maxR = 38;
                const luasVal = w.luas || 1000;
                const computedR = Math.round(minR + Math.min(Math.max((luasVal - minLuas) / (maxLuas - minLuas), 0), 1) * (maxR - minR));
                const dynamicRadius = isSelected ? computedR + 8 : computedR;

                return (
                    <CircleMarker
                        key={w.id}
                        center={[w.lat, w.lng]}
                        radius={dynamicRadius}
                        pathOptions={{
                            color: isSelected ? strokeColor : 'white',
                            weight: isSelected ? 3 : 2,
                            fillColor,
                            fillOpacity,
                        }}
                        eventHandlers={{
                            click: () => onSelect(w.id),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                            <div style={{ fontFamily: 'Poppins, sans-serif', padding: '2px 4px' }}>
                                <p style={{ fontWeight: 700, fontSize: '12px', margin: 0, color: '#0F172A' }}>{w.name}</p>
                                <p style={{ fontSize: '10px', margin: 0, color: isTinggi ? '#059669' : '#E11D48', fontWeight: 600 }}>
                                    {isTinggi ? 'Transaksi Tinggi' : 'Transaksi Rendah'}
                                </p>
                                <p style={{ fontSize: '9px', margin: 0, color: '#64748B', fontWeight: 500 }}>
                                    Luas: {w.luas.toLocaleString('id-ID')} km²
                                </p>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                );
            })}

            {/* Markers/Pins Teardrop untuk tiap produk di database (Matching Gambar 2) */}
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
                                    background: isSupply ? 'rgba(72,187,120,0.12)' : 'rgba(49,130,206,0.12)',
                                    color: isSupply ? '#2F855A' : '#2B6CB0',
                                    fontSize: 9, fontWeight: 700,
                                    padding: '2px 8px', borderRadius: 20,
                                    marginBottom: 6
                                }}>
                                    {isSupply ? 'STOK SUPPLIER (PETANI)' : 'PERMINTAAN BUYER (PEDAGANG)'}
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
