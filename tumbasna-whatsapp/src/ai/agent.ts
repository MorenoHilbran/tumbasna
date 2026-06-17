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

        // 3. Mapping untuk LangChain
        const chatHistory = historyJson.slice(0, -1).map(msg => 
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );

        // 4. Setup LangChain ChatOpenAI Client
        const chat = new ChatOpenAI({
            apiKey: apiKey,
            configuration: { baseURL: rootBaseUrl },
            modelName: modelName,
            temperature: 0.1,
            maxRetries: 1,
        });

        const sendMessages = [
            new SystemMessage(SYSTEM_PROMPT),
            ...chatHistory,
            new HumanMessage(`Pesan Input:\n"${message}"`)
        ];

        console.log(`🤖 [AI CALL] Mengirim ke LLM (${modelName}) untuk ${phoneNumber}...`);
        
        // 5. Invoke LLM dengan Timeout (menggunakan Promise.race sebagai simulasi sederhana jika needed, tapi ChatOpenAI punya parameter sendiri)
        const responseMsg = await chat.invoke(sendMessages);
        const text = responseMsg.content.toString();
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
