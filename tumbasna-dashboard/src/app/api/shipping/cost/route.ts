import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { origin, destination, weight, courier } = body;

        // OPSI 1: COD (Bayar di Tempat) - Rp 0
        if (courier === 'cod') {
            return NextResponse.json({
                success: true,
                courier: 'COD',
                cost: 0,
                estimation: 'Pembayaran ongkir saat barang tiba'
            });
        }

        const weightGram = Math.max(1, weight || 1000);
        const weightKg = Math.max(1, Math.ceil(weightGram / 1000));

        // OPSI 2: Kurir Lokal (Pengiriman Internal / Tarif Tetap)
        if (courier === 'kurir-lokal') {
            return NextResponse.json({
                success: true,
                courier: 'Kurir Lokal',
                cost: 0,
                estimation: 'Tarif ongkir dinegosiasikan dengan supplier'
            });
        }

        // OPSI 3: Ekspedisi (Menggunakan RajaOngkir)
        if (courier === 'ekspedisi' || courier === 'jne' || courier === 'pos' || courier === 'tiki') {
            const RAJAONGKIR_KEY = process.env.RAJAONGKIR_API_KEY;
            const BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com/starter';
            
            if (RAJAONGKIR_KEY) {
                try {
                    // Mapping origin/destination ke city ID RajaOngkir
                    const originId = body.originId || '501'; 
                    const destinationId = body.destinationId || '114';
                    const roCourier = courier === 'ekspedisi' ? 'jne' : courier;

                    const response = await fetch(`${BASE_URL}/cost`, {
                        method: 'POST',
                        headers: {
                            'key': RAJAONGKIR_KEY,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            origin: originId,
                            destination: destinationId,
                            weight: weightGram.toString(),
                            courier: roCourier
                        })
                    });

                    const data = await response.json();
                    if (data.rajaongkir && data.rajaongkir.status.code === 200) {
                        const result = data.rajaongkir.results[0];
                        if (result && result.costs.length > 0) {
                            const service = result.costs[0]; // ambil servis pertama
                            return NextResponse.json({
                                success: true,
                                courier: `Ekspedisi (${result.name})`,
                                cost: service.cost[0].value,
                                estimation: `${service.cost[0].etd} Hari`
                            });
                        }
                    }
                } catch (err) {
                    console.error('RajaOngkir Fetch Error:', err);
                }
            }

            // Fallback Ekspedisi jika API Key tidak ada/gagal
            const fallbackCost = 25000 + (weightKg * 5000);
            return NextResponse.json({
                success: true,
                courier: 'Ekspedisi (Sistem Default)',
                cost: fallbackCost,
                estimation: '2-3 Hari',
                note: 'Menggunakan tarif estimasi (API Key RajaOngkir belum ada/gagal)'
            });
        }

        // Default Fallback
        return NextResponse.json({
            success: true,
            courier: courier || 'Unknown',
            cost: 15000 * weightKg,
            estimation: '3-5 Hari'
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
