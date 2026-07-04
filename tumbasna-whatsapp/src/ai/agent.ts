import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ParsedData } from "../types";
import { SYSTEM_PROMPT } from "./prompts";
import { getSessionHistory, saveSessionHistory } from "./memory";

export async function extractMessageData(sender: string, message: string): Promise<ParsedData> {
    const phoneNumber = sender.split('@')[0];
    let historyJson: any[] = [];
    
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY is not defined");

        const envBaseUrl = process.env.OPENAI_BASE_URL || "https://ai.semutssh.com/v1/chat/completions";
        const rootBaseUrl = envBaseUrl.replace('/chat/completions', '');
        const modelName = process.env.OPENAI_MODEL || "gemini-3-flash-preview";

        // 1. Ambil History
        historyJson = await getSessionHistory(sender);

        // 2. Tambahkan pesan user ke history SEKARANG (agar tercatat meskipun AI error nanti)
        historyJson.push({ role: "user", content: `Pesan Input:\n"${message}"` });
        if (historyJson.length > 10) historyJson = historyJson.slice(historyJson.length - 10);
        
        // Simpan sementara pesan user ke DB
        await saveSessionHistory(sender, historyJson, false);

        // 3. Setup Native Google GenAI
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const formattedHistory = historyJson.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        formattedHistory.push({
            role: 'user',
            parts: [{ text: `Pesan Input:\n"${message}"` }]
        });

        console.log(`🤖 [AI CALL] Mengirim ke Gemini Native untuk ${phoneNumber}...`);
        
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: formattedHistory,
            config: {
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                temperature: 0.1
            }
        });
        
        const text = response.text;
        // console.log(`🤖 [AI RAW RESPONSE]:\n${text}`);

        const cleanJson = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
        const parsedResult = JSON.parse(cleanJson) as ParsedData;

        // 6. Update History dengan jawaban AI
        historyJson.push({ role: "assistant", content: cleanJson });
        if (historyJson.length > 10) historyJson = historyJson.slice(historyJson.length - 10);

        // 7. Simpan state session final
        const isFinished = parsedResult.intent === "CANCEL";
        await saveSessionHistory(sender, historyJson, isFinished);

        return parsedResult;

    } catch (error: any) {
        console.error(`❌ [AGENT ERROR] ${phoneNumber}:`, error.message || error);
        
        // Jika gagal, setidaknya kita sudah simpan pesan user di langkah 2
        return {
            intent: "UNKNOWN",
            items: [],
            status: "INCOMPLETE",
            reply_message: "Maaf, saya mengalami kendala saat memproses pesan Anda. Bisa diulang kembali?"
        };
    }
}
