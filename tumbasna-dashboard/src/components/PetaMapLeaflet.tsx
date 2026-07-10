'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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
        if (!selected) return;
        const w = wilayahData.find(x => x.id === selected);
        if (w) {
            map.flyTo([w.lat, w.lng], 10, { duration: 1.2 });
        }
    }, [selected, wilayahData, map]);
    return null;
}

// ─── Main Map Component ───────────────────────────────────────
export default function PetaMapLeaflet({ wilayahData, selected, onSelect, productPoints }: PetaMapLeafletProps) {
    // Center: tengah Barlingmascakeb & Tegal
    const center: [number, number] = [-7.25, 109.30];

    return (
        <MapContainer
            center={center}
            zoom={8}
            maxBounds={[[-12.0, 94.0], [8.0, 142.5]]}
            maxBoundsViscosity={1.0}
            minZoom={5}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
        >
            {/* Tile Layer — OpenStreetMap */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto-pan saat marker dipilih dari footer */}
            <PanToSelected wilayahData={wilayahData} selected={selected} />

            {/* Markers per wilayah */}
            {wilayahData.map((w) => {
                const melimpah = w.status === 'melimpah';
                const isSelected = selected === w.id;
                const fillColor = melimpah ? '#7FBB54' : '#EF4444';
                const fillOpacity = isSelected ? 0.75 : 0.45;
                const strokeColor = melimpah ? '#5E9C36' : '#DC2626';

                return (
                    <CircleMarker
                        key={w.id}
                        center={[w.lat, w.lng]}
                        radius={isSelected ? 36 : 28}
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
                        <Popup
                            offset={[0, -10]}
                        >
                            <div style={{ fontFamily: 'Poppins, sans-serif', minWidth: '180px', padding: '4px' }}>
                                {/* Header popup */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    marginBottom: '8px', paddingBottom: '8px',
                                    borderBottom: '1px solid #DDE5D8'
                                }}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: fillColor, flexShrink: 0
                                    }} />
                                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1F3826' }}>{w.name}</span>
                                </div>

                                {/* Status badge */}
                                <div style={{
                                    display: 'inline-block',
                                    background: melimpah ? 'rgba(127,187,84,0.12)' : 'rgba(239,68,68,0.10)',
                                    color: melimpah ? '#5E9C36' : '#DC2626',
                                    fontSize: 10, fontWeight: 700,
                                    padding: '2px 8px', borderRadius: 20,
                                    marginBottom: 8
                                }}>
                                    Stok {w.status}
                                </div>

                                {/* Stats grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                                    {[
                                        { label: 'Supplier', value: w.supplier },
                                        { label: 'Buyer', value: w.buyer },
                                        { label: 'Total Stok', value: w.stok },
                                        { label: 'Transaksi', value: w.transaksi },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: '#F4F7F2', borderRadius: 8, padding: '6px 8px' }}>
                                            <p style={{ fontSize: 9, color: '#8DA88F', margin: 0, fontWeight: 500 }}>{s.label}</p>
                                            <p style={{ fontSize: 12, color: '#1F3826', margin: 0, fontWeight: 700 }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Komoditas */}
                                <p style={{ fontSize: 10, color: '#1F3826', fontWeight: 600, marginBottom: 4 }}>Komoditas:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {w.komoditas.slice(0, 4).map(k => (
                                        <span key={k} style={{
                                            fontSize: 9, fontWeight: 600,
                                            background: 'rgba(127,187,84,0.12)', color: '#3A7A28',
                                            border: '1px solid rgba(127,187,84,0.3)',
                                            padding: '2px 6px', borderRadius: 20
                                        }}>{k}</span>
                                    ))}
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

            {/* Markers/Pins untuk tiap produk di database */}
            {productPoints?.map((p) => {
                const isSupply = p.type === 'SUPPLY';
                const fillColor = isSupply ? '#10B981' : '#3B82F6'; // Emerald for supply, Blue for demand
                const strokeColor = isSupply ? '#047857' : '#1D4ED8';
                
                return (
                    <CircleMarker
                        key={`prod-${p.id}`}
                        center={[p.lat, p.lng]}
                        radius={10}
                        pathOptions={{
                            color: strokeColor,
                            weight: 2,
                            fillColor,
                            fillOpacity: 0.9,
                        }}
                    >
                        <Popup offset={[0, -5]}>
                            <div style={{ fontFamily: 'Poppins, sans-serif', minWidth: '150px', padding: '4px' }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#1F3826', marginBottom: 4 }}>
                                    {p.commodity}
                                </div>
                                <div style={{
                                    display: 'inline-block',
                                    background: isSupply ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                                    color: isSupply ? '#059669' : '#2563EB',
                                    fontSize: 9, fontWeight: 700,
                                    padding: '1px 6px', borderRadius: 20,
                                    marginBottom: 6
                                }}>
                                    {isSupply ? 'PENAWARAN (SUPPLY)' : 'PERMINTAAN (DEMAND)'}
                                </div>
                                <div style={{ fontSize: 11, color: '#4B5563', margin: '2px 0' }}>
                                    <strong>Volume:</strong> {p.qty} kg
                                </div>
                                <div style={{ fontSize: 11, color: '#4B5563', margin: '2px 0' }}>
                                    <strong>Lokasi:</strong> {p.location}
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
