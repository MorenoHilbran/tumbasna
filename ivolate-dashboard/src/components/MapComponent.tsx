'use client';

import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

interface GeoPoint {
    id: string;
    lat: number;
    lng: number;
    type: 'SUPPLY' | 'DEMAND';
    commodity: string;
    qty: number;
    location: string;
}

interface MapComponentProps {
    points: GeoPoint[];
}

export default function MapComponent({ points }: MapComponentProps) {
    // Center of Central Java roughly
    const defaultCenter: [number, number] = [-7.150969, 110.140259];

    // Prevent "Map container is already initialized" error during React 18 strict mode / hot-reloads
    // By providing a unique stable key per component mount, we force React to create a fresh DOM node 
    // instead of reusing the one Leaflet already mutated.
    const [mapKey] = useState(() => `map-${new Date().getTime()}-${Math.random()}`);

    // Fix Leaflet default icon — MUST be inside useEffect (client-only, after mount)
    // Turbopack evaluates modules strictly; top-level L.Icon access crashes before window exists
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const L = require('leaflet');
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    return (
        <div className="w-full h-full min-h-[400px] z-0 relative rounded-lg overflow-hidden border">
            <MapContainer key={mapKey} center={defaultCenter} zoom={8} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {points.map((point) => (
                    <CircleMarker
                        key={point.id}
                        center={[point.lat, point.lng]}
                        radius={8 + Math.min(point.qty / 10, 15)} // scale radius slightly with quantity
                        pathOptions={{
                            color: point.type === 'SUPPLY' ? '#10b981' : '#ef4444', // Green for SUPPLY, Red for DEMAND
                            fillColor: point.type === 'SUPPLY' ? '#10b981' : '#ef4444',
                            fillOpacity: 0.6,
                        }}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm">
                                    {point.type === 'SUPPLY' ? '🛒 SUPPLY' : '🎯 DEMAND'}
                                </h3>
                                <p className="text-xs text-gray-600 capitalize">{point.commodity}</p>
                                <p className="text-xs">Location: {point.location}</p>
                                <p className="text-xs font-semibold">Qty: {point.qty}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
