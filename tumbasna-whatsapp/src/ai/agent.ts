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

        const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
        const modelName = process.env.OPENAI_MODEL || 'llama-3.1-8b-instant';

        // 1. Ambil History
        historyJson = await getSessionHistory(sender);

        // 2. Cek status registrasi riil di DB
        let isRegistered = false;
        let registeredName = '';
        try {
            const { apiService } = require('../services/apiService');
            const whitelistRes = await apiService.checkWhitelist(phoneNumber);
            isRegistered = !!whitelistRes?.isRegistered;
            registeredName = whitelistRes?.name || '';
        } catch (dbErr: any) {
            console.warn(`⚠️ [AGENT] Gagal cek status registrasi DB, fallback ke false:`, dbErr.message);
        }

        // 3. Tambahkan pesan user ke history SEKARANG (agar tercatat meskipun AI error nanti)
        historyJson.push({ role: "user", content: `Pesan Input:\n"${message}"` });
        if (historyJson.length > 10) historyJson = historyJson.slice(historyJson.length - 10);
        
        // Simpan sementara pesan user ke DB/Memory
        await saveSessionHistory(sender, historyJson, false);

        // 4. Mapping history untuk LangChain
        const chatHistory = historyJson.slice(0, -1).map((msg: any) =>
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );

        // Modifikasi SYSTEM_PROMPT dinamis berdasarkan status registrasi riil di database
        const dynamicSystemPrompt = `${SYSTEM_PROMPT}

=== REAL-TIME DATABASE USER STATUS ===
- User Registered in Database: ${isRegistered ? "YES" : "NO"}
${isRegistered ? `- Registered Name: "${registeredName}"` : ""}
- INSTRUCTION: ${isRegistered ? "USER IS ALREADY REGISTERED. DO NOT ask for name, location, or start REGISTER flow. Go straight to SUPPLY, STATUS, or other post-registration flows." : "USER IS NOT REGISTERED. You MUST start or continue the conversational REGISTER flow to collect their name and location."}
`;

        let text = "";
        try {
            const { GoogleGenAI } = require("@google/genai");
            const aiStudio = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
            
            // Format messages for direct Gemini API call
            const contents = [
                { role: 'user', parts: [{ text: dynamicSystemPrompt }] }
            ];
            
            for (const msg of historyJson.slice(0, -1)) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            }
            
            contents.push({
                role: 'user',
                parts: [{ text: `Pesan Input:\n"${message}"` }]
            });
            
            console.log(`🤖 [AI CALL] Mengirim ke Gemini Direct (gemini-1.5-flash) untuk ${phoneNumber}...`);
            const response = await aiStudio.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: contents
            });
            
            if (response.text) {
                text = response.text;
            } else {
                throw new Error("Empty response from Gemini Direct");
            }
        } catch (geminiError: any) {
            console.warn(`⚠️ [GEMINI ERROR] Gagal menggunakan Gemini Direct, beralih ke Groq Fallback:`, geminiError.message || geminiError);
            
            // Setup Groq client using LangChain ChatOpenAI
            const chat = new ChatOpenAI({
                apiKey: apiKey,
                configuration: { baseURL: baseUrl },
                modelName: modelName,
                temperature: 0.1,
                maxRetries: 1,
            });
            
            const sendMessages = [
                new SystemMessage(dynamicSystemPrompt),
                ...chatHistory,
                new HumanMessage(`Pesan Input:\n"${message}"`)
            ];
            
            console.log(`🤖 [AI CALL] Mengirim ke Groq Fallback (${modelName}) untuk ${phoneNumber}...`);
            const responseMsg = await chat.invoke(sendMessages);
            text = responseMsg.content.toString();
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

        // 6. Update History dengan jawaban AI
        historyJson.push({ role: "assistant", content: cleanJson });
        if (historyJson.length > 10) historyJson = historyJson.slice(historyJson.length - 10);

        // 7. Simpan state session final
        const isFinished = parsedResult.intent === "CANCEL";
        await saveSessionHistory(sender, historyJson, isFinished);

        return parsedResult;

    } catch (error: any) {
        console.error(`❌ [AGENT ERROR] ${phoneNumber}:`, error.message || error);
        
        return {
            intent: "UNKNOWN",
            items: [],
            status: "INCOMPLETE",
            reply_message: "Maaf, saya mengalami kendala saat memproses pesan Anda. Bisa diulang kembali?"
        };
    }
}
