import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialization to ensure process.env is loaded
let aiInstance: GoogleGenAI | null = null;

function getAIInstance() {
    if (!aiInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ ERROR: GEMINI_API_KEY tidak ditemukan di environment variables.");
        }
        aiInstance = new GoogleGenAI({
            apiKey: apiKey || ""
        });
    }
    return aiInstance;
}

export interface ParsedItem {
    commodity: string;
    weight_kg: number;
    price: number;
    location: string;
}

export interface ParsedData {
    intent: "SUPPLY" | "DEMAND" | "CANCEL" | "INQUIRY" | "CORRECTION" | "UNKNOWN";
    items: ParsedItem[];
    status: "COMPLETE" | "INCOMPLETE" | "WARNING";
    reply_message: string;
}

export async function extractMessageData(message: string): Promise<ParsedData> {
    const ai = getAIInstance();
    
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined");
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: `
Kamu adalah asisten logistik Tumbasna. Tugas Anda adalah mengubah pesan WhatsApp berikut menjadi JSON terstruktur untuk sistem Supply-Demand-Match.

=== PESAN INPUT ===
"${message}"
==================

=== INSTRUKSI KHUSUS (Handling Test Cases) ===

1. INTENT DETECTION: 
   - 'SUPPLY': Menawarkan/jual barang.
   - 'DEMAND': Mencari/beli barang.
   - 'CANCEL': Jika user ingin membatalkan (Contoh: "batal", "gak jadi").
   - 'INQUIRY': Jika user bertanya stok (Contoh: "ada stok apa aja?").
   - 'CORRECTION': Jika user mengoreksi pesan sebelumnya (Contoh: "maksudnya 200kg").
   - 'UNKNOWN': Jika maksud tidak jelas.

2. DATA EXTRACTION & NORMALIZATION:
   - Satuan: Selalu konversi ke KG (1 Ton = 1000, 1 Kuintal = 100).
   - Harga: Bersihkan karakter non-angka (7rb -> 7000, 1jt -> 1000000).
   - Multiple Items: Jika user menyebut >1 barang, buat array dalam field 'items'.
   - Commodity: Standarisasi nama komoditas (contoh: "cabe" -> "Cabai Merah", "bwg" -> "Bawang Merah"). Buang kata sifat seperti "Super", "Mulus".
   - Location: Standarisasi ke nama Kabupaten/Kota di Indonesia atau "Unknown".

3. VALIDASI (Status):
   - Jika data (komoditas/berat) tidak ada, set status: "INCOMPLETE".
   - Jika harga tidak masuk akal (misal: Beras Rp 500), set status: "WARNING" dan beri alasan di 'reply_message'.
   - Jika semua data lengkap dan valid, set status: "COMPLETE".

4. REPLY MESSAGE:
   - Tulis respon WhatsApp yang natural, sopan, dan dalam bahasa Indonesia.
   - Jika status COMPLETE, konfirmasi data yang dicatat.
   - Jika status INCOMPLETE, tanya data yang kurang dengan ramah.
   - Jika status WARNING, jelaskan kekhawatiran mengenai harga/data tersebut.

=== ATURAN OUTPUT ===
- Output HARUS berupa JSON valid sesuai schema.
- Jangan tambahkan teks penjelasan di luar JSON.
`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: { type: Type.STRING, enum: ["SUPPLY", "DEMAND", "CANCEL", "INQUIRY", "CORRECTION", "UNKNOWN"] },
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    commodity: { type: Type.STRING },
                                    weight_kg: { type: Type.NUMBER },
                                    price: { type: Type.NUMBER },
                                    location: { type: Type.STRING }
                                },
                                required: ["commodity", "weight_kg", "price", "location"]
                            }
                        },
                        status: { type: Type.STRING, enum: ["COMPLETE", "INCOMPLETE", "WARNING"] },
                        reply_message: { type: Type.STRING }
                    },
                    required: ["intent", "items", "status", "reply_message"]
                }
            }
        });

        if (!response.text) {
            throw new Error("Empty text in Gemini response");
        }

        const text = response.text.trim();
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (error: any) {
        console.error("Gemini Extraction Error:", error.message || error);
        return {
            intent: "UNKNOWN",
            items: [],
            status: "INCOMPLETE",
            reply_message: "Maaf, saya mengalami kendala saat memproses pesan Anda. Bisa diulang kembali?"
        };
    }
}
