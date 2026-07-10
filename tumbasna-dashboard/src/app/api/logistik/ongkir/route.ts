import { NextResponse } from 'next/server';

// Fallback OSRM routing to get distance in KM
async function getRoadDistanceKm(origin: [number, number], dest: [number, number]): Promise<number> {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    // 1. Try Mapbox Directions first
    if (mapboxToken) {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?geometries=geojson&access_token=${mapboxToken}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.routes && data.routes[0]) {
                    return data.routes[0].distance / 1000; // convert meters to KM
                }
            }
        } catch (err) {
            console.error('[ONGKIR API] Mapbox Directions failed, falling back to OSRM:', err);
        }
    }

    // 2. Fallback to free public OSRM API
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${dest[1]},${dest[0]}?overview=false`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes[0]) {
                return data.routes[0].distance / 1000; // convert meters to KM
            }
        }
    } catch (err) {
        console.error('[ONGKIR API] OSRM API failed, falling back to straight line distance:', err);
    }

    // 3. Fallback to Haversine (straight line) if all APIs fail
    const R = 6371; // Earth's radius in KM
    const dLat = ((dest[0] - origin[0]) * Math.PI) / 180;
    const dLng = ((dest[1] - origin[1]) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origin[0] * Math.PI) / 180) *
            Math.cos((dest[0] * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.25; // Estimate road distance factor (approx 25% curve overhead)
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { originLat, originLng, destinationLat, destinationLng, weightGram = 300000 } = body;

        if (!originLat || !originLng || !destinationLat || !destinationLng) {
            return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
        }

        // Get driving road distance
        const distanceKm = await getRoadDistanceKm([originLat, originLng], [destinationLat, destinationLng]);

        // ─── 1. Calculate Self-Delivery (Armada Mandiri Supplier) ───
        // Flat Rp 5.000 / km
        const selfCost = Math.round(distanceKm * 5000);
        const selfEta = distanceKm <= 50 ? '3-6 Jam' : '1 Hari';

        // ─── 2. Get Commercial Rates (Biteship API or Mock) ───
        const biteshipApiKey = process.env.BITESHIP_API_KEY;
        let commercialOptions: any[] = [];

        if (biteshipApiKey && biteshipApiKey !== 'your_biteship_api_key') {
            try {
                const response = await fetch("https://api.biteship.com/v1/rates", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${biteshipApiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        origin_latitude: originLat,
                        origin_longitude: originLng,
                        destination_latitude: destinationLat,
                        destination_longitude: destinationLng,
                        couriers: "jne,jnt,sicepat",
                        items: [{ name: "Komoditas Pertanian", value: 2000000, weight: weightGram, quantity: 1 }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.pricing && Array.isArray(data.pricing)) {
                        commercialOptions = data.pricing.map((p: any) => ({
                            id: `${p.company}-${p.type}`,
                            name: `${p.company.toUpperCase()} ${p.type.toUpperCase()}`,
                            type: 'komersial',
                            cost: p.price,
                            eta: p.duration === '1-1' ? '1 Hari' : p.duration ? `${p.duration} Hari` : '2-3 Hari',
                            description: `Kurir komersial via penjemputan Biteship`
                        }));
                    }
                }
            } catch (err) {
                console.error('[ONGKIR API] Failed to fetch Biteship live rates, using mock instead:', err);
            }
        }

        // Fallback or Mock generator for JNE, J&T, SiCepat if Biteship is offline/not configured
        if (commercialOptions.length === 0) {
            const weightKg = weightGram / 1000;
            // Base rate per kg for local region is around Rp 10.000 - Rp 15.000
            const ratePerKg = 10000 + Math.min(Math.round(distanceKm * 150), 25000);
            
            const jneCost = Math.round(weightKg * ratePerKg * 0.95);
            const jntCost = Math.round(weightKg * ratePerKg);
            const sicepatCost = Math.round(weightKg * ratePerKg * 0.9);

            commercialOptions = [
                {
                    id: 'jne-reg',
                    name: 'JNE REG',
                    type: 'komersial',
                    cost: jneCost,
                    eta: distanceKm <= 100 ? '1-2 Hari' : '2-3 Hari',
                    description: 'Layanan reguler kurir komersial JNE'
                },
                {
                    id: 'jnt-ez',
                    name: 'J&T EZ',
                    type: 'komersial',
                    cost: jntCost,
                    eta: distanceKm <= 100 ? '1-2 Hari' : '2-3 Hari',
                    description: 'Layanan reguler kurir komersial J&T'
                },
                {
                    id: 'sicepat-reg',
                    name: 'SiCepat REG',
                    type: 'komersial',
                    cost: sicepatCost,
                    eta: distanceKm <= 100 ? '1-2 Hari' : '2-3 Hari',
                    description: 'Layanan reguler kurir komersial SiCepat'
                }
            ];
        }

        // ─── 3. Combine Options & Apply Recommendation Logic ───
        const allOptions = [
            {
                id: 'self-delivery',
                name: 'Armada Mandiri (Supplier)',
                type: 'mandiri',
                cost: selfCost,
                eta: selfEta,
                description: 'Supplier mengirim sendiri langsung ke lokasi pembeli'
            },
            ...commercialOptions
        ];

        // Find the lowest cost option
        let lowestCostIndex = 0;
        let lowestCostValue = allOptions[0].cost;
        for (let i = 1; i < allOptions.length; i++) {
            if (allOptions[i].cost < lowestCostValue) {
                lowestCostValue = allOptions[i].cost;
                lowestCostIndex = i;
            }
        }

        const optionsWithRecommendation = allOptions.map((opt, index) => {
            const isRecommended = index === lowestCostIndex;
            let reason = '';
            if (isRecommended) {
                if (opt.id === 'self-delivery') {
                    reason = 'Rekomendasi Terbaik: Lebih murah untuk volume besar & pengiriman langsung hari yang sama.';
                } else {
                    reason = 'Rekomendasi Terbaik: Opsi paling hemat untuk rute ini.';
                }
            }
            return {
                ...opt,
                isRecommended,
                recommendationReason: reason
            };
        });

        return NextResponse.json({
            success: true,
            distanceKm: Math.round(distanceKm * 10) / 10,
            options: optionsWithRecommendation
        });

    } catch (error: any) {
        console.error('[ONGKIR API ERROR]', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
