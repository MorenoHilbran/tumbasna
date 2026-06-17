import { GoogleGenAI, Type } from "@google/genai";

// Inisialisasi menggunakan API Key dari .env
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export async function extractMessageData(message: string) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `
Kamu adalah sistem ekstraksi data komoditas pangan Indonesia yang sangat andal.
Tugasmu: analisis pesan WhatsApp berikut dan kembalikan JSON terstruktur.

=== PESAN INPUT ===
"${message}"
===================

=== ATURAN EKSTRAKSI ===

1. FIELD "type" — Klasifikasi transaksi:
   - Nilai SUPPLY jika pesan mengandung kata/konteks seperti:
     jual, dijual, mau jual, ada stok, panen, ada barang, ready, siap kirim,
     lelang, nawarin, jual murah, punya, stok tersedia, mau lepas, offering,
     ada sisa, over stok, overstock, mau jualin, nitip jual
   - Nilai DEMAND jika pesan mengandung kata/konteks seperti:
     beli, mau beli, cari, butuh, need, nyari, perlu, minta, order,
     cari supplier, mau beli, dibutuhkan, demand, hunting, wanted, WTB,
     minta penawaran, pengadaan, procurement

2. FIELD "commodity" — Nama komoditas:
   - Standarisasi ke nama baku Indonesia (contoh: "cabe" → "Cabai Merah", "bwg" → "Bawang Merah")
   - Tulis dengan huruf kapital di awal kata.
   - Jika tidak ada komoditas jelas, isi "Unknown".

3. FIELD "qty" — Kuantitas (angka saja, tanpa satuan):
   - Hapus satuan: kg, ton, kwintal, kw, kuintal, karung, ikat, pcs, buah, dll.
   - Konversi: 1 ton = 1000 kg, 1 kwintal = 100 kg. Hasil dalam kg.
   - Jika tidak ada angka kuantitas, isi 0.

4. FIELD "price" — Harga (angka saja, dalam Rupiah):
   - Hapus simbol: Rp, rp, IDR, /kg, ribu, rb, jt, K, k, dll.
   - Konversi: 1 juta = 1000000, 1 rb/ribu = 1000, 5k = 5000.
   - Jika tidak ada harga, isi 0.

5. FIELD "location" — Standarisasi ke nama Kabupaten/Kota resmi Indonesia:
   Gunakan tabel singkatan berikut (tidak case-sensitive):
   pwt / purwekerto / purwkerto → Purwokerto
   smg / semarng / semarangkota → Semarang
   jkt / jakrta / jakarta / jkrt → Jakarta
   sby / surabya / surabaya → Surabaya
   bdg / bandng / bandung → Bandung
   yk / jogja / yogya / jogjakarta / djogja → Yogyakarta
   solo / slo / surakrta → Surakarta
   mlg / malng / malang → Malang
   mdn / medan / medn → Medan
   mksr / makasar / ujung pandang → Makassar
   plg / palembng → Palembang
   lpg / lmpg / lampung → Lampung
   pdg / padang → Padang
   pku / pekanbar / pekanbru → Pekanbaru
   btm / batam → Batam
   srg / srang / serang → Serang
   tng / tangrang / tangerang → Tangerang
   bksi / beksi → Bekasi
   bgr / bogor / bogr → Bogor
   dpk / depok → Depok
   crb / cirebn / cirebon → Cirebon
   tsk / tasik / tasikmalaya → Tasikmalaya
   grt / garut → Garut
   smd / samarinda → Samarinda
   bpp / balikpapan → Balikpapan
   bjm / banjarmasin → Banjarmasin
   pnk / pontianak → Pontianak
   ktpg / palangkaraya → Palangka Raya
   manado / mnd → Manado
   palu / plu → Palu
   kendari / kdr → Kendari
   ambon / amb → Ambon
   sorong / srg sorong → Sorong
   jayapura / jyp → Jayapura
   
   Jika lokasi sudah jelas tapi tidak ada di tabel: tulis nama aslinya dengan format Title Case.
   Jika lokasi tidak disebut sama sekali: isi "Unknown".

=== PENTING ===
- Jangan tambahkan komentar atau teks di luar JSON.
- Jika pesan ambigu, buat asumsi terbaik berdasarkan konteks.
- Output HARUS berupa JSON valid sesuai schema yang diberikan.
`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        commodity: { type: Type.STRING },
                        qty: { type: Type.NUMBER },
                        price: { type: Type.NUMBER },
                        location: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["SUPPLY", "DEMAND"] }
                    },
                    required: ["commodity", "qty", "price", "location", "type"]
                }
            }
        });

        if (!response.text) {
            throw new Error("Empty text in Gemini response");
        }

        const text = response.text.trim();

        // Membersihkan jika ada backticks markdown
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Gemini 3 Extraction Error:", error);
        // Fallback data agar sistem tidak crash
        return {
            commodity: "Unknown",
            qty: 0,
            price: 0,
            location: "Unknown",
            type: "SUPPLY"
        };
    }
}