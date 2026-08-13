'use client';

import { useEffect, useState, memo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { Store, Sprout, Truck } from 'lucide-react';

// ─── Coordinates Lookup ──────────────────────────────────────
const coordsMap: Record<string, [number, number]> = {
    'Banyumas': [-7.5151, 109.2941],
    'Cilacap': [-7.7150, 108.9767],
    'Purbalingga': [-7.3884, 109.3641],
    'Banjarnegara': [-7.3884, 109.6939],
    'Kebumen': [-7.6701, 109.6524],
    'Tegal': [-6.8676, 109.1384]
};

// Nominatim OpenStreetMap Geocoding helper
async function fetchGeocode(address: string): Promise<[number, number] | null> {
    if (!address) return null;
    try {
        let queryStr = address;
        if (!queryStr.toLowerCase().includes('indonesia')) {
            queryStr += ', Indonesia';
        }
        const query = encodeURIComponent(queryStr);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        if (res.ok) {
            const data = await res.json();
            if (data && data[0]) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                return [lat, lon];
            }
        }
    } catch (err) {
        console.error('Error geocoding address:', address, err);
    }
    return null;
}

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
    supplierLocation?: string;
    buyerAddress?: string;
    supplierCoords?: [number, number] | null;
    buyerCoords?: [number, number] | null;
}

interface LogistikMapLeafletProps {
    armadaData: ArmadaItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

// ─── Custom HTML Leaflet 3D Icons ─────────────────────────────
// Supplier (Produsen / Petani) 3D Isometric Icon
const createSupplierIcon = () => {
    return L.divIcon({
        html: `
            <div style="background: transparent !important; border: none !important;" class="flex items-center justify-center cursor-pointer transition-transform hover:scale-125">
                <img 
                    src="/icons/3d-supplier.png" 
                    alt="Supplier 3D" 
                    style="width: 52px; height: 52px; object-fit: contain;"
                />
            </div>
        `,
        className: 'custom-leaflet-marker-clean',
        iconSize: [52, 52],
        iconAnchor: [26, 26]
    });
};

// UMKM (Pedagang / Demand) 3D Isometric Icon
const createUmkmIcon = () => {
    return L.divIcon({
        html: `
            <div style="background: transparent !important; border: none !important;" class="flex items-center justify-center cursor-pointer transition-transform hover:scale-125">
                <img 
                    src="/icons/3d-umkm.png" 
                    alt="UMKM 3D" 
                    style="width: 52px; height: 52px; object-fit: contain;"
                />
            </div>
        `,
        className: 'custom-leaflet-marker-clean',
        iconSize: [52, 52],
        iconAnchor: [26, 26]
    });
};

// Kurir (3D Delivery Box Truck) Icon
const createTruckIcon = (color: string, isSelected: boolean) => {
    const size = isSelected ? 60 : 52;
    return L.divIcon({
        html: `
            <div style="background: transparent !important; border: none !important;" class="flex items-center justify-center cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-125'}">
                <img 
                    src="/icons/3d-truck.png" 
                    alt="Kurir 3D Truck" 
                    style="width: ${size}px; height: ${size}px; object-fit: contain;"
                />
            </div>
        `,
        className: 'custom-leaflet-marker-clean',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

// ─── Distance & Path Interpolation Helpers ────────────────────
const getDistance = (p1: [number, number], p2: [number, number]) => {
    const dy = p2[0] - p1[0];
    const dx = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
};

const getPositionAlongPath = (path: [number, number][], progressPercent: number): [number, number] => {
    if (!path || path.length === 0) return [-7.55, 109.25];
    if (path.length === 1 || progressPercent <= 0) return path[0];
    if (progressPercent >= 100) return path[path.length - 1];

    let totalLength = 0;
    const segmentLengths: number[] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const len = getDistance(path[i], path[i + 1]);
        segmentLengths.push(len);
        totalLength += len;
    }

    if (totalLength === 0) return path[0];

    const targetLength = totalLength * (progressPercent / 100);
    let accumulatedLength = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const segLen = segmentLengths[i];
        if (accumulatedLength + segLen >= targetLength) {
            const remaining = targetLength - accumulatedLength;
            const fraction = segLen > 0 ? remaining / segLen : 0;
            const p1 = path[i];
            const p2 = path[i + 1];
            const lat = p1[0] + (p2[0] - p1[0]) * fraction;
            const lng = p1[1] + (p2[1] - p1[1]) * fraction;
            if (isNaN(lat) || isNaN(lng)) return p1;
            return [lat, lng];
        }
        accumulatedLength += segLen;
    }

    return path[path.length - 1];
};

// ─── Helper: Pan Map to Selected Truck position ──────────────
function PanToSelectedTruck({ armadaData, selectedId, routePaths, coordsCache }: { 
    armadaData: ArmadaItem[]; 
    selectedId: string | null; 
    routePaths: Record<string, [number, number][]>;
    coordsCache: Record<string, [number, number]>;
}) {
    const map = useMap();
    useEffect(() => {
        if (!selectedId || !map) return;
        const a = armadaData.find(x => x.id === selectedId);
        if (a) {
            const origin = a.supplierCoords || coordsCache[a.supplierLocation || a.rute.dari] || coordsCache[a.rute.dari];
            const dest = a.buyerCoords || coordsCache[a.buyerAddress || a.rute.ke] || coordsCache[a.rute.ke];

            if (origin && Array.isArray(origin) && !isNaN(origin[0]) && !isNaN(origin[1]) &&
                dest && Array.isArray(dest) && !isNaN(dest[0]) && !isNaN(dest[1])) {
                let targetPos: [number, number] | null = null;
                const path = routePaths[a.id];
                if (path && path.length > 0) {
                    targetPos = getPositionAlongPath(path, a.progress);
                } else {
                    const fraction = (a.progress || 0) / 100;
                    const lat = origin[0] + (dest[0] - origin[0]) * fraction;
                    const lng = origin[1] + (dest[1] - origin[1]) * fraction;
                    targetPos = [lat, lng];
                }

                if (targetPos && !isNaN(targetPos[0]) && !isNaN(targetPos[1]) && isFinite(targetPos[0]) && isFinite(targetPos[1])) {
                    try {
                        map.flyTo(targetPos, 11, { duration: 1.2 });
                    } catch (e) {
                        console.warn('PanToSelectedTruck flyTo warning:', e);
                    }
                }
            }
        }
    }, [selectedId, armadaData, routePaths, coordsCache, map]);
    return null;
}

export default memo(function LogistikMapLeaflet({ armadaData, selectedId, onSelect }: LogistikMapLeafletProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [animProgress, setAnimProgress] = useState(0);

    // 10-Second Continuous Moving Truck Animation Loop
    useEffect(() => {
        if (!mounted) return;
        let startTime: number | null = null;
        let animationFrameId: number;

        const duration = 10000; // 10 Detik tepat

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            
            setAnimProgress(progress);

            if (progress < 100) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                // Tunggu 1.5 detik saat sampai di tujuan, lalu animasi ulang dari lokasi asal
                setTimeout(() => {
                    startTime = null;
                    animationFrameId = requestAnimationFrame(step);
                }, 1500);
            }
        };

        animationFrameId = requestAnimationFrame(step);
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [mounted]);

    const center: [number, number] = [-7.3884, 109.3641]; // Center of Kabupaten Purbalingga
    const [routePaths, setRoutePaths] = useState<Record<string, [number, number][]>>({});
    const [coordsCache, setCoordsCache] = useState<Record<string, [number, number]>>(coordsMap);

    // Geocoding missing addresses
    useEffect(() => {
        let isMounted = true;
        const geocodeMissing = async () => {
            const newCache = { ...coordsCache };
            let updated = false;

            for (const a of armadaData) {
                if (!isMounted) return;

                // Check supplier location
                const sLoc = a.supplierLocation || a.rute.dari;
                if (sLoc && !newCache[sLoc] && !a.supplierCoords) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (!isMounted) return;
                    const coords = await fetchGeocode(sLoc);
                    if (coords) {
                        newCache[sLoc] = coords;
                        updated = true;
                    }
                }

                // Check buyer address
                const bAddr = a.buyerAddress || a.rute.ke;
                if (bAddr && !newCache[bAddr] && !a.buyerCoords) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (!isMounted) return;
                    const coords = await fetchGeocode(bAddr);
                    if (coords) {
                        newCache[bAddr] = coords;
                        updated = true;
                    }
                }
            }

            if (updated && isMounted) {
                setCoordsCache(newCache);
            }
        };

        geocodeMissing();
        return () => {
            isMounted = false;
        };
    }, [armadaData]);

    // Fetch road paths dynamically from OSRM public routing API
    useEffect(() => {
        const fetchRoutes = async () => {
            const newPaths = { ...routePaths };
            let updated = false;

            for (const a of armadaData) {
                if (newPaths[a.id]) continue; // Already loaded

                const origin = a.supplierCoords || coordsCache[a.supplierLocation || a.rute.dari] || coordsCache[a.rute.dari];
                const dest = a.buyerCoords || coordsCache[a.buyerAddress || a.rute.ke] || coordsCache[a.rute.ke];
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
    }, [armadaData, routePaths, coordsCache]);

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
            key="tumbasna-logistik-map-root"
            center={center}
            zoom={11}
            maxBounds={[[-12.0, 94.0], [8.0, 142.5]]}
            maxBoundsViscosity={1.0}
            minZoom={5}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                maxZoom={20}
            />

            <PanToSelectedTruck armadaData={armadaData} selectedId={selectedId} routePaths={routePaths} coordsCache={coordsCache} />

            {armadaData.map((a) => {
                const origin = a.supplierCoords || coordsCache[a.supplierLocation || a.rute.dari] || coordsCache[a.rute.dari];
                const dest = a.buyerCoords || coordsCache[a.buyerAddress || a.rute.ke] || coordsCache[a.rute.ke];

                if (!origin || !dest || isNaN(origin[0]) || isNaN(origin[1]) || isNaN(dest[0]) || isNaN(dest[1])) return null;

                const path = routePaths[a.id];
                const hasRoadPath = path && path.length > 0;

                // Calculate 10-second animated position (Full 0% -> 100% journey to destination)
                const animatedProgress = animProgress;

                let currentPos: [number, number];
                if (hasRoadPath) {
                    currentPos = getPositionAlongPath(path, animatedProgress);
                } else {
                    const fraction = animatedProgress / 100;
                    const currentLat = origin[0] + (dest[0] - origin[0]) * fraction;
                    const currentLng = origin[1] + (dest[1] - origin[1]) * fraction;
                    currentPos = [currentLat, currentLng];
                }

                if (!currentPos || isNaN(currentPos[0]) || isNaN(currentPos[1])) return null;

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
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: '11px', color: '#F97316' }}>🌾 Titik Pengirim (Supplier / Petani)</p>
                                    <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#334155' }}>Gudang/Petani di {a.supplierLocation || a.rute.dari}</p>
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
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: '11px', color: '#3B82F6' }}>🏪 Titik Penerima (UMKM / Pedagang)</p>
                                    <p style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#334155' }}>Pedagang/Pasar di {a.buyerAddress || a.rute.ke}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Layer 1: Outer Casing / Contrast Outline (Gojek / Google Maps Navigation Style) */}
                        <Polyline
                            positions={hasRoadPath ? path : [origin, dest]}
                            pathOptions={{
                                color: isSelected ? '#064E3B' : '#1E3A8A',
                                weight: isSelected ? 9 : 7,
                                opacity: isSelected ? 0.95 : 0.5,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />

                        {/* Layer 2: Inner Core Navigation Line */}
                        <Polyline
                            positions={hasRoadPath ? path : [origin, dest]}
                            pathOptions={{
                                color: isSelected ? '#10B981' : '#3B82F6',
                                weight: isSelected ? 5 : 3.5,
                                opacity: 1.0,
                                lineCap: 'round',
                                lineJoin: 'round',
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
                                    <p style={{ fontSize: '9px', margin: 0, color: '#64748B', fontWeight: 500 }}>Rute: {a.supplierLocation || a.rute.dari} → {a.buyerAddress || a.rute.ke} ({a.jarak})</p>
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
});
