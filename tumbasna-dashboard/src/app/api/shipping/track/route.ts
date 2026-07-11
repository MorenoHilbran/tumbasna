import { NextResponse } from 'next/server';

// GET /api/shipping/track?waybill=NOMOR_RESI&courier=jne
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const waybill = searchParams.get('waybill');
        const courier = searchParams.get('courier') || 'jne';

        if (!waybill) {
            return NextResponse.json({ success: false, error: 'Parameter waybill wajib diisi.' }, { status: 400 });
        }

        const RAJAONGKIR_KEY = process.env.RAJAONGKIR_API_KEY;
        const BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com/starter';

        if (RAJAONGKIR_KEY) {
            try {
                const response = await fetch(`${BASE_URL}/waybill`, {
                    method: 'POST',
                    headers: {
                        'key': RAJAONGKIR_KEY,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        waybill,
                        courier: courier.toLowerCase()
                    })
                });

                const data = await response.json();

                if (data.rajaongkir && data.rajaongkir.status.code === 200) {
                    const result = data.rajaongkir.result;
                    const manifests: Array<{ date: string; time: string; description: string; cityName: string }> = 
                        (result.manifest || []).map((m: any) => ({
                            date: m.manifest_date,
                            time: m.manifest_time,
                            description: m.manifest_description,
                            cityName: m.city_name || ''
                        }));

                    const lastManifest = manifests[manifests.length - 1] || null;

                    return NextResponse.json({
                        success: true,
                        waybill,
                        courier: result.details?.courier?.name || courier.toUpperCase(),
                        status: result.delivery_status?.status || 'UNKNOWN',
                        statusDescription: result.delivery_status?.pod_receiver
                            ? `Diterima oleh: ${result.delivery_status.pod_receiver}`
                            : (result.delivery_status?.status || ''),
                        lastCity: lastManifest?.cityName || '',
                        manifests
                    });
                }

                return NextResponse.json({
                    success: false,
                    error: data.rajaongkir?.status?.description || 'Nomor resi tidak ditemukan.'
                }, { status: 404 });

            } catch (err) {
                console.error('[tracking] RajaOngkir error:', err);
            }
        }

        // Fallback jika API Key tidak tersedia
        return NextResponse.json({
            success: false,
            error: 'Layanan pelacakan resi belum dikonfigurasi. Pastikan RAJAONGKIR_API_KEY sudah diisi di .env.'
        }, { status: 503 });

    } catch (error: any) {
        console.error('[API SHIPPING TRACK ERROR]', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
