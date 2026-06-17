export interface ParsedMessage {
    intent: 'SUPPLY' | 'DEMAND' | 'UNKNOWN';
    commodity: string | null;
    volume: number | null;
    price: number | null;
    location: string | null;
}

/**
 * TODO(AI): Di masa depan, fungsi ini akan memanggil API AI (Gemini/OpenAI) 
 * untuk NLP parsing yang lebih pintar dan tidak kaku.
 * Sementara kita pakai Regex manual dulu.
 */
export function handleMessage(text: string): ParsedMessage {
    const normalized = text.toLowerCase().trim();
    
    const result: ParsedMessage = {
        intent: 'UNKNOWN',
        commodity: null,
        volume: null,
        price: null,
        location: null,
    };

    // 1. Detect Intent
    if (normalized.includes('jual')) {
        result.intent = 'SUPPLY';
    } else if (normalized.includes('butuh') || normalized.includes('beli') || normalized.includes('cari')) {
        result.intent = 'DEMAND';
    }

    if (result.intent === 'UNKNOWN') return result;

    // 2. Extrac Commodity (kata setelah jual/butuh/beli)
    // Contoh: "jual cabai merah 300kg" -> "cabai merah"
    const commodityMatch = normalized.match(/(?:jual|butuh|beli|cari)\s+([a-zA-Z\s]+?)\s+\d/);
    if (commodityMatch && commodityMatch[1]) {
        result.commodity = commodityMatch[1].trim();
    }

    // 3. Extract Volume (angka sebelum kg/ton)
    const volumeMatch = normalized.match(/(\d+)\s*(?:kg|ton|kuintal)/);
    if (volumeMatch && volumeMatch[1]) {
        result.volume = parseInt(volumeMatch[1], 10);
        // Normalisasi ke KG kalau mau (sementara anggap input selalu kg)
    }

    // 4. Extract Price (angka setelah harga/rp)
    const priceMatch = normalized.match(/(?:harga|rp|@)\s*(\d+)/);
    if (priceMatch && priceMatch[1]) {
        result.price = parseInt(priceMatch[1], 10);
    }

    // 5. Extract Location (kata di paling akhir, setelah harga + angka)
    // Asumsi format: "... harga 25000 banyumas"
    const locationMatch = normalized.match(/(?:harga|rp|@)\s*\d+\s+([a-zA-Z\s]+)$/);
    if (locationMatch && locationMatch[1]) {
        result.location = locationMatch[1].trim();
    }

    return result;
}
