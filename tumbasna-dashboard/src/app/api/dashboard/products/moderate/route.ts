import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Kata kunci mencurigakan / dilarang
const FORBIDDEN_WORDS = [
  'ganja', 'sabu', 'ekstasi', 'narkoba', 'obat terlarang', 'sabu-sabu', 'heroin', 'marijuana',
  'senjata', 'pistol', 'senpi', 'bom', 'peluru', 'senapan', 'bahan peledak',
  'alkohol', 'miras', 'minuman keras', 'tuak', 'ciuk', 'beer', 'whisky', 'vodka',
  'judi', 'slot', 'casino', 'hacker', 'hack', 'chip', 'porno', 'seks', 'dewasa',
  'racun', 'sianida', 'senjata tajam', 'keris', 'pisau'
];

export async function GET() {
  try {
    const supplyEntries = await prisma.productEntry.findMany({
      where: { type: 'SUPPLY' },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    const analyzedProducts = supplyEntries.map(entry => {
      const commodityLower = entry.commodity.toLowerCase();
      const locationLower = entry.location.toLowerCase();
      
      const matchedForbidden: string[] = [];
      let safetyScore = 100;

      FORBIDDEN_WORDS.forEach(word => {
        if (commodityLower.includes(word) || locationLower.includes(word)) {
          matchedForbidden.push(word);
          safetyScore = Math.max(0, safetyScore - 45); // Potong skor keamanan untuk setiap kata terlarang
        }
      });

      // Validasi apakah komoditas pangan logis (Pertanian/Peternakan/Perikanan)
      const validCommodityKeywords = [
        'beras', 'padi', 'jagung', 'cabai', 'cabe', 'bawang', 'kentang', 'tomat', 'wortel', 
        'sayur', 'buah', 'kedelai', 'gula', 'minyak', 'telur', 'ayam', 'sapi', 'kambing', 
        'ikan', 'udang', 'daging', 'susu', 'pangan', 'kopi', 'teh', 'cengkeh', 'kelapa'
      ];
      
      const isAgricultural = validCommodityKeywords.some(keyword => commodityLower.includes(keyword));
      if (!isAgricultural && matchedForbidden.length === 0) {
        // Jika bukan komoditas pangan umum dan tidak ada kata terlarang langsung, beri skor 60% (Kategori Meragukan)
        safetyScore = 60;
      }

      return {
        id: entry.id,
        commodity: entry.commodity,
        qty: Number(entry.qty),
        price: Number(entry.price),
        location: entry.location,
        image: entry.image,
        createdAt: entry.createdAt,
        status: entry.status,
        supplierName: entry.user.name || 'Petani ' + entry.user.phoneNumber,
        supplierPhone: entry.user.phoneNumber,
        safetyAnalysis: {
          safetyScore,
          isSafe: safetyScore >= 70,
          isAgricultural,
          flags: matchedForbidden,
          riskLevel: safetyScore < 50 ? 'HIGH' : safetyScore < 80 ? 'MEDIUM' : 'LOW'
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: analyzedProducts
    });
  } catch (error: any) {
    console.error('[API MODERATION GET ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    // Hapus product entry dari database
    await prisma.productEntry.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dimoderasi dan dihapus permanen'
    });
  } catch (error: any) {
    console.error('[API MODERATION DELETE ERROR]', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
