import { ParsedMessage } from '../services/parserService';

export function buildReplyMessage(intent: 'SUPPLY' | 'DEMAND', data: any, matched: boolean = false): string {
    const matchInfo = matched ? '\n\n🎉 *KABAR BAIK!* Kami menemukan kecocokan yang pas untuk Anda di sistem kami. Cek dashboard atau tunggu notifikasi selanjutnya!' : '';

    if (intent === 'SUPPLY') {
        return `📦 *Data panen dicatat*

Komoditas: ${data.commodity || '-'}
Volume: ${data.volume ? data.volume + 'kg' : '-'}
Harga: Rp${data.price || '-'}
Lokasi: ${data.location || '-'}${matchInfo}

Kami akan mencarikan pembeli.`;
    }

    if (intent === 'DEMAND') {
        return `🔎 *Data kebutuhan dicatat*

Kebutuhan: ${data.commodity || '-'}
Volume: ${data.volume ? data.volume + 'kg' : '-'}
Harga Target: Rp${data.price || '-'}
Lokasi: ${data.location || '-'}${matchInfo}

Kami akan mengabari jika ada kecocokan.`;
    }

    return 'Maaf, pesan Anda tidak dapat dipahami.';
}
