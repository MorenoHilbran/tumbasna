import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { origin, destination, weight, courier } = body;

        // Aturan Khusus: Jika COD, ongkos kirim diset 0
        if (courier === 'cod') {
            return NextResponse.json({
                success: true,
                courier: 'COD',
                cost: 0,
                estimation: 'Pembayaran ongkir saat barang tiba'
            });
        }

        // RajaOngkir Integration
        const RAJAONGKIR_KEY = process.env.RAJAONGKIR_API_KEY;
        const BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com/starter';
        
        // Asumsi weight dalam gram
        const weightGram = Math.max(1, weight || 1000);

        if (RAJAONGKIR_KEY) {
            try {
                // Mapping origin/destination ke city ID RajaOngkir
                // Karena MVP kita belum menyimpan city_id, kita hardcode atau asumsikan 
                // city_id asal dan tujuan (misal 501 untuk Yogyakarta, 114 untuk Denpasar) 
                // Atau jika ada di payload dari frontend:
                const originId = body.originId || '501'; 
                const destinationId = body.destinationId || '114';
                // Kurir yang didukung starter: jne, pos, tiki
                const roCourier = (courier === 'kurir-lokal' || courier === 'ekspedisi') ? 'jne' : courier;

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
                            courier: result.name || courier,
                            cost: service.cost[0].value,
                            estimation: `${service.cost[0].etd} Hari`
                        });
                    }
                }
            } catch (err) {
                console.error('RajaOngkir Fetch Error:', err);
                // Fallback ke simulasi jika error
            }
        }

        // Fallback Simulasi jika API Key tidak ada atau gagal
        const weightKg = Math.max(1, Math.ceil(weightGram / 1000));
        let cost = 0;
        let estimation = '';

        if (courier === 'kurir-lokal') {
            cost = 40000 + (weightKg * 2000); // Base + weight modifier
            estimation = '1-2 Hari';
        } else if (courier === 'ekspedisi') {
            cost = 25000 + (weightKg * 5000); 
            estimation = '2-3 Hari (Next Day)';
        } else {
            // Default fallback
            cost = 15000 * weightKg;
            estimation = '3-5 Hari';
        }

        return NextResponse.json({
            success: true,
            courier,
            cost,
            estimation,
            note: 'using fallback calculation'
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
