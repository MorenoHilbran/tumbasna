import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ParsedData } from "../types";
import { SYSTEM_PROMPT } from "./prompts";
import { getSessionHistory, saveSessionHistory, getEffectivePhoneNumber } from "./memory";

export async function extractMessageData(sender: string, message: string): Promise<ParsedData> {
    const phoneNumber = await getEffectivePhoneNumber(sender);
    let historyJson: any[] = [];
    
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY is not defined");

        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
        
        // Ambil settings untuk AI model & Whitelist komoditas
        let currentModel = 'llama-3.1-8b-instant';
        let whitelistComms: string[] = [];
        let aiBotActive = true;
        
        try {
            const { apiService } = await import('../services/apiService');
            const settingsRes = await apiService.getSettings();
            if (settingsRes && settingsRes.success && settingsRes.data) {
                currentModel = settingsRes.data.supplier.aiModel || currentModel;
                whitelistComms = settingsRes.data.supplier.whitelistCommodities || [];
                aiBotActive = settingsRes.data.supplier.aiBotActive ?? true;
            }
        } catch (settingsErr: any) {
            console.warn(`⚠️ [AGENT] Gagal mengambil settings API, menggunakan default:`, settingsErr.message);
        }

        // Cek jika bot dinonaktifkan oleh Admin
        if (!aiBotActive) {
            return {
                intent: "UNKNOWN",
                items: [],
                status: "INCOMPLETE",
                reply_message: "Maaf, sistem asisten AI WhatsApp sedang dinonaktifkan sementara oleh Admin untuk pemeliharaan sistem. Silakan hubungi kami kembali beberapa saat lagi. Terima kasih."
            };
        }

        // 1. Ambil History
        historyJson = await getSessionHistory(sender);

        // 2. Cek status registrasi riil di DB
        let isRegistered = false;
        let registeredName = '';
        let userProfileInfo = '';
        try {
            const { apiService } = await import('../services/apiService');
            const whitelistRes = await apiService.checkWhitelist(phoneNumber);
            if (whitelistRes && whitelistRes.success) {
                isRegistered = !!whitelistRes?.isRegistered;
                registeredName = whitelistRes?.name || '';
                
                // Build user profile info untuk inject ke system prompt
                if (isRegistered) {
                    userProfileInfo = `
=== USER PROFILE (FROM DATABASE) ===
- Registered: YES
- Name: "${registeredName}"
- Phone: "+${phoneNumber}"
- Bank: "${whitelistRes?.bankName || '-'} - ${whitelistRes?.bankAccount || '-'}"
- Location: "${whitelistRes?.address || '-'}"
- Business Name: "${whitelistRes?.businessName || '-'}"

IMPORTANT: USER SUDAH TERDAFTAR. JANGAN TANYAKAN DATA REGISTRASI (nama/lokasi/bank) LAGI!
Jika user input SUPPLY, langsung proses tanpa tanya nama/lokasi/bank karena data sudah ada di database.
`;
                }
            }
        } catch (dbErr: any) {
            console.warn(`⚠️ [AGENT] Gagal cek status registrasi DB:`, dbErr.message);
        }

        // Jika user terdaftar tetapi history masih mengandung REGISTER, bersihkan history
        if (isRegistered && historyJson.some((h: any) => h.content && h.content.includes('"intent":"REGISTER"'))) {
            console.log(`🧹 [AGENT] User sudah terdaftar tetapi history memiliki intent REGISTER. Pembersihan history dilakukan.`);
            historyJson = [];
            await saveSessionHistory(sender, [], true);
        }

        // 3. Tambahkan pesan user ke history SEKARANG (agar tercatat meskipun AI error nanti)
        historyJson.push({ role: "user", content: `Pesan Input:\n"${message}"` });
        if (historyJson.length > 20) historyJson = historyJson.slice(historyJson.length - 20);
        
        // Simpan sementara pesan user ke DB/Memory
        await saveSessionHistory(sender, historyJson, false);

        // Filter out metadata messages from history before passing to LLM
        const filteredHistory = historyJson.filter((msg: any) => msg.role !== 'metadata');

        // 4. Mapping history untuk LangChain
        const chatHistory = filteredHistory.slice(0, -1).map((msg: any) =>
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );

        // Modifikasi SYSTEM_PROMPT dinamis berdasarkan status registrasi riil di database dan whitelist komoditas
        const dynamicSystemPrompt = `${SYSTEM_PROMPT}

=== REAL-TIME DATABASE USER STATUS ===
- User Registered in Database: ${isRegistered ? "YES" : "NO"}
${isRegistered ? `- Registered Name: "${registeredName}"` : ""}
- INSTRUCTION: ${isRegistered ? "USER IS ALREADY REGISTERED. DO NOT ask for name, location, or start REGISTER flow. Go straight to SUPPLY, STATUS, or other post-registration flows." : "USER IS NOT REGISTERED. You MUST start or continue the conversational REGISTER flow to collect their name and location."}

${userProfileInfo}

=== ALLOWED COMMODITIES (WHITELIST) ===
Anda HANYA diperbolehkan menerima tawaran (intent SUPPLY) untuk komoditas pangan/pertanian berikut:
${whitelistComms.length > 0 ? whitelistComms.join(', ') : "Beras, Jagung, Tomat, Cabai, Bawang, Kentang"}
Jika user menawarkan komoditas yang TIDAK ADA dalam whitelist di atas, ikuti prosedur COMMODITY_REQUEST seperti dijelaskan di system prompt.
`;

        let text = "";
        try {
            console.log(`🤖 [AI CALL] Mengirim ke Groq Utama (${currentModel}) untuk ${phoneNumber}...`);
            
            // Setup Groq client using LangChain ChatOpenAI
            const chat = new ChatOpenAI({
                apiKey: apiKey,
                configuration: { baseURL: baseUrl },
                modelName: currentModel,
                temperature: 0.1,
                maxRetries: 1,
            });
            
            const sendMessages = [
                new SystemMessage(dynamicSystemPrompt),
                ...chatHistory,
                new HumanMessage(`Pesan Input:\n"${message}"`)
            ];
            
            const responseMsg = await chat.invoke(sendMessages);
            text = responseMsg.content.toString();
        } catch (groqError: any) {
            console.warn(`⚠️ [GROQ ERROR] Gagal menggunakan Groq, beralih ke Gemini Fallback:`, groqError.message || groqError);
            
            try {
                // Gunakan library GenAI baru secara dinamis
                const { GoogleGenAI } = await import("@google/genai");
                const aiStudio = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                
                // Format messages for direct Gemini API call
                const contents = [];
                
                for (const msg of filteredHistory.slice(0, -1)) {
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    });
                }
                
                contents.push({
                    role: 'user',
                    parts: [{ text: `Pesan Input:\n"${message}"` }]
                });
                
                console.log(`🤖 [AI CALL] Mengirim ke Gemini Fallback (gemini-1.5-flash) untuk ${phoneNumber}...`);
                const response = await aiStudio.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: contents,
                    config: {
                        systemInstruction: dynamicSystemPrompt
                    }
                });
                
                if (response.text) {
                    text = response.text;
                } else {
                    throw new Error("Empty response from Gemini Fallback");
                }
            } catch (geminiError: any) {
                console.error(`❌ [ALL AI FAILED] Groq dan Gemini error:`, geminiError.message);
                throw geminiError;
            }
        }

        // Ekstrak JSON secara robust — ambil dari { pertama sampai } terakhir
        // Menangani kasus LLM menambahkan teks prefix seperti "Output:\n{"
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error(`❌ [AGENT] Tidak ada JSON ditemukan di response:\n${text.substring(0, 200)}`);
            throw new Error('AI response tidak mengandung JSON valid');
        }
        const cleanJson = jsonMatch[0];
        const parsedResult = JSON.parse(cleanJson) as ParsedData;

        // Log hasil parser untuk debugging
        console.log(`🤖 [AI RESULT] Parsed:`, JSON.stringify(parsedResult));

        // Fallback jika reply_message kosong/tidak ada
        if (!parsedResult.reply_message || !parsedResult.reply_message.trim()) {
            if (parsedResult.intent === 'REGISTER') {
                parsedResult.reply_message = "Selamat datang di Tumbasna! 🌾 Mohon sebutkan nama Juragan beserta lokasi kebun/gudang untuk memulai pendaftaran.";
            } else {
                parsedResult.reply_message = "Halo Juragan! Ada yang bisa saya bantu terkait penawaran hasil tani atau pesanan komoditas Anda? 🌾";
            }
        }

        // 6. Update History dengan jawaban AI
        historyJson.push({ role: "assistant", content: cleanJson });
        if (historyJson.length > 20) historyJson = historyJson.slice(historyJson.length - 20);

        // 7. Simpan state session final
        const isFinished = parsedResult.intent === "CANCEL";
        await saveSessionHistory(sender, historyJson, isFinished);

        return parsedResult;

    } catch (error: any) {
        console.error(`❌ [AGENT ERROR] ${phoneNumber}:`, error.message || error);
        
        // Fallback parser jika LLM mengalami masalah format JSON/timeout saat input produk
        const textLower = message.toLowerCase();
        const commodities = ['beras', 'cabai', 'cabe', 'bawang', 'tomat', 'kentang', 'jagung', 'kedelai', 'jahe', 'kopi', 'nanas', 'duku', 'durian', 'gula'];
        const matchedComm = commodities.find(c => textLower.includes(c));

        if (matchedComm) {
            const numbers = message.match(/\d+(?:[\.,]\d+)?/g);
            if (numbers && numbers.length >= 1) {
                const qty = parseFloat(numbers[0].replace(',', '.'));
                const rawPrice = numbers.length >= 2 ? parseFloat(numbers[1].replace(/\./g, '').replace(',', '.')) : 15000;
                const price = rawPrice > 500 ? rawPrice : rawPrice * 1000;

                console.log(`💡 [AGENT FALLBACK] Mengekstrak SUPPLY dari fallback parser: ${matchedComm} ${qty}kg Rp${price}`);
                return {
                    intent: 'SUPPLY',
                    items: [{
                        commodity: matchedComm,
                        weight_kg: qty || 10,
                        price: price,
                        location: 'Purbalingga'
                    }],
                    status: 'COMPLETE',
                    reply_message: `🎉 *PRODUK BERHASIL DITAMBAHKAN!*\n\nKomoditas *${matchedComm.toUpperCase()}* sebanyak *${qty} kg* dengan harga *Rp ${Number(price).toLocaleString('id-ID')}/kg* telah dicatat di sistem.\n\n✅ *Penawaran Anda sudah aktif dan tampil di aplikasi Tumbasna!*`
                };
            }
        }

        return {
            intent: "UNKNOWN",
            items: [],
            status: "INCOMPLETE",
            reply_message: "Halo Juragan! Mohon sebutkan nama komoditas (seperti beras/cabai), jumlah kg, dan harga per kg yang ingin ditawarkan. 🌾"
        };
    }
}
