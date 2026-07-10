'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Coordinates Lookup ──────────────────────────────────────
const coordsMap: Record<string, [number, number]> = {
    'Banyumas': [-7.5151, 109.2941],
    'Cilacap': [-7.7150, 108.9767],
    'Purbalingga': [-7.3884, 109.3641],
    'Banjarnegara': [-7.3884, 109.6939],
    'Kebumen': [-7.6701, 109.6524],
    'Tegal': [-6.8676, 109.1384]
};

// ─── Types ───────────────────────────────────────────────────
interface ArmadaItem {
    id: string;
    driver: string;
    plat: string;
    rute: { dari: string; ke: string };
    muatan: string;
    status: string;
    progress: number;
    estimasi: string;
    jarak: string;
}

interface LogistikMapLeafletProps {
    armadaData: ArmadaItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

// ─── Custom HTML Leaflet Icons ───────────────────────────────
// Supplier (Warehouse) Icon
const createSupplierIcon = () => {
    return L.divIcon({
        html: `
            <div class="bg-emerald-500 text-white rounded-full border-2 border-white shadow-md flex items-center justify-center w-8 h-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 10v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10"></path>
                    <path d="M22 10 12 2 2 10"></path>
                    <path d="M6 22V12h12v10"></path>
                </svg>
            </div>
        `,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

// UMKM (Store) Icon
const createUmkmIcon = () => {
    return L.divIcon({
        html: `
            <div class="bg-rose-500 text-white rounded-full border-2 border-white shadow-md flex items-center justify-center w-8 h-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 20a2 2 0 0 0 .6-1.4V8.4a2 2 0 0 0-1.2-1.8l-6.4-2.8a2 2 0 0 0-1.6 0L5 7a2 2 0 0 0-1.2 1.8v10.2A2 2 0 0 0 4.4 20"></path>
                    <path d="M3 7h18"></path>
                    <path d="M12 22V7"></path>
                    <path d="M12 12H7"></path>
                    <path d="M12 16h5"></path>
                </svg>
            </div>
        `,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

// Truck (Armada) Icon
const createTruckIcon = (color: string, isSelected: boolean) => {
    const bg = color === '#10B981' ? 'bg-emerald-500' : color === '#EF4444' ? 'bg-rose-500' : 'bg-emerald-600';
    const border = isSelected ? 'border-slate-900 border-3 scale-110 shadow-lg' : 'border-white border-2 shadow-md';
    return L.divIcon({
        html: `
            <div class="${bg} ${border} text-white rounded-full flex items-center justify-center w-9 h-9 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
            </div>
        `,
        className: 'custom-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });
};

// ─── Distance & Path Interpolation Helpers ────────────────────
const getDistance = (p1: [number, number], p2: [number, number]) => {
    const dy = p2[0] - p1[0];
    const dx = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
};

const getPositionAlongPath = (path: [number, number][], progressPercent: number): [number, number] => {
    if (path.length === 0) return [0, 0];
    if (path.length === 1) return path[0];
    if (progressPercent <= 0) return path[0];
    if (progressPercent >= 100) return path[path.length - 1];

    let totalLength = 0;
    const segmentLengths: number[] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const len = getDistance(path[i], path[i + 1]);
        segmentLengths.push(len);
        totalLength += len;
    }

    const targetLength = totalLength * (progressPercent / 100);
    let accumulatedLength = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const segLen = segmentLengths[i];
        if (accumulatedLength + segLen >= targetLength) {
            const remaining = targetLength - accumulatedLength;
            const fraction = remaining / segLen;
            const p1 = path[i];
            const p2 = path[i + 1];
            const lat = p1[0] + (p2[0] - p1[0]) * fraction;
            const lng = p1[1] + (p2[1] - p1[1]) * fraction;
            return [lat, lng];
        }
        accumulatedLength += segLen;
    }

    return path[path.length - 1];
};

// ─── Helper: Pan Map to Selected Truck position ──────────────
function PanToSelectedTruck({ armadaData, selectedId, routePaths }: { armadaData: ArmadaItem[]; selectedId: string | null; routePaths: Record<string, [number, number][]> }) {
    const map = useMap();
    useEffect(() => {
        if (!selectedId) return;
        const a = armadaData.find(x => x.id === selectedId);
        if (a) {
            const origin = coordsMap[a.rute.dari];
            const dest = coordsMap[a.rute.ke];
            if (origin && dest) {
                const path = routePaths[a.id];
                if (path && path.length > 0) {
                    const currentPos = getPositionAlongPath(path, a.progress);
                    map.flyTo(currentPos, 11, { duration: 1.2 });
                } else {
                    const fraction = a.progress / 100;
                    const lat = origin[0] + (dest[0] - origin[0]) * fraction;
                    const lng = origin[1] + (dest[1] - origin[1]) * fraction;
                    map.flyTo([lat, lng], 11, { duration: 1.2 });
                }
            }
        }
    }, [selectedId, armadaData, routePaths, map]);
    return null;
}

// ─── Main Map Component ───────────────────────────────────────
export default function LogistikMapLeaflet({ armadaData, selectedId, onSelect }: LogistikMapLeafletProps) {
    const center: [number, number] = [-7.55, 109.25]; // Center of Barlingmascakeb
    const [routePaths, setRoutePaths] = useState<Record<string, [number, number][]>>({});

    // Fetch road paths dynamically from OSRM public routing API
    useEffect(() => {
        const fetchRoutes = async () => {
            const newPaths = { ...routePaths };
            let updated = false;

            for (const a of armadaData) {
                if (newPaths[a.id]) continue; // Already loaded

                const origin = coordsMap[a.rute.dari];
                const dest = coordsMap[a.rute.ke];
                if (!origin || !dest) continue;

                try {
                    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
                    let url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;

                    if (mapboxToken) {
                        url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?geometries=geojson&overview=full&access_token=${mapboxToken}`;
                    }

                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.routes && data.routes[0]) {
                            const coords = data.routes[0].geometry.coordinates;
                            const path = coords.map(([lng, lat]: [number, number]) => [lat, lng]);
                            newPaths[a.id] = path;
                            updated = true;
                        }
                    }
                } catch (err) {
                    console.error(`Gagal mengambil rute untuk ${a.id}:`, err);
                }
            }

            if (updated) {
                setRoutePaths(newPaths);
            }
        };

        fetchRoutes();
    }, [armadaData, routePaths]);

    return (
        <MapContainer
            center={center}
            zoom={9}
            maxBounds={[[-12.0, 94.0], [8.0, 142.5]]}
            maxBoundsViscosity={1.0}
            minZoom={5}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <PanToSelectedTruck armadaData={armadaData} selectedId={selectedId} routePaths={routePaths} />

            {armadaData.map((a) => {
                const origin = coordsMap[a.rute.dari];
                const dest = coordsMap[a.rute.ke];

                if (!origin || !dest) return null;

                const path = routePaths[a.id];
                const hasRoadPath = path && path.length > 0;

                // Calculate exact position along the road network or fallback to straight line
                let currentPos: [number, number];
                if (hasRoadPath) {
                    currentPos = getPositionAlongPath(path, a.progress);
                } else {
                    const fraction = a.progress / 100;
                    const currentLat = origin[0] + (dest[0] - origin[0]) * fraction;
                    const currentLng = origin[1] + (dest[1] - origin[1]) * fraction;
                    currentPos = [currentLat, currentLng];
                }

                const isSelected = selectedId === a.id;
                const truckColor = a.status === 'selesai' ? '#10B981' : a.status === 'masalah' ? '#EF4444' : '#059669';

                return (
                    <div key={a.id}>
                        {/* Origin marker (Warehouse Icon) */}
                        <Marker
                            position={origin}
                            icon={createSupplierIcon()}
                        >
                            <Popup offset={[0, -10]}>
                                <div style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: '11px', color: '#10B981' }}>Titik Pengirim (Supplier)</p>
                                    <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#334155' }}>Gudang/Petani di {a.rute.dari}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Destination marker (UMKM/Store Icon) */}
                        <Marker
                            position={dest}
                            icon={createUmkmIcon()}
                        >
                            <Popup offset={[0, -10]}>
                                <div style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: '11px', color: '#EF4444' }}>Titik Penerima (UMKM)</p>
                                    <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#334155' }}>Pedagang/Pasar di {a.rute.ke}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Route Line following actual road paths */}
                        <Polyline
                            positions={hasRoadPath ? path : [origin, dest]}
                            pathOptions={{
                                color: isSelected ? '#059669' : '#94A3B8',
                                weight: isSelected ? 4 : 2,
                                opacity: isSelected ? 0.95 : 0.45,
                            }}
                        />

                        {/* Current Position (Truck Marker) */}
                        <Marker
                            position={currentPos}
                            icon={createTruckIcon(truckColor, isSelected)}
                            eventHandlers={{
                                click: () => onSelect(a.id),
                            }}
                        >
                            <Popup offset={[0, -10]}>
                                <div style={{ fontFamily: 'Poppins, sans-serif', minWidth: '170px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 850, color: '#0F172A', fontSize: '11px' }}>{a.id}</span>
                                        <span style={{
                                            fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px',
                                            background: a.status === 'selesai' ? '#ECFDF5' : a.status === 'masalah' ? '#FEF2F2' : '#F0FDF4',
                                            color: a.status === 'selesai' ? '#065F46' : a.status === 'masalah' ? '#991B1B' : '#166534'
                                        }}>
                                            {a.status === 'jalan' ? 'Jalan' : a.status === 'selesai' ? 'Selesai' : a.status === 'masalah' ? 'Masalah' : 'Standby'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '10px', margin: '0 0 2px 0', color: '#334155', fontWeight: 750 }}>Supir: {a.driver}</p>
                                    <p style={{ fontSize: '10px', margin: '0 0 2px 0', color: '#334155' }}>Muatan: {a.muatan.split('—')[0]}</p>
                                    <p style={{ fontSize: '9px', margin: 0, color: '#64748B', fontWeight: 500 }}>Rute: {a.rute.dari} → {a.rute.ke} ({a.jarak})</p>
                                    <div style={{ marginTop: '6px', background: '#F8FAFC', borderRadius: '6px', padding: '4px 6px', fontSize: '9px', fontWeight: 700, color: '#475569' }}>
                                        Progress: {a.progress}% • ETA: {a.estimasi}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    </div>
                );
            })}
        </MapContainer>
    );
}
