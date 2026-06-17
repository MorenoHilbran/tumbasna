const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const apiKeyLine = env.split('\n').find(l => l.startsWith('GEMINI_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim().replace(/['"]/g, '') : null;

const { GoogleGenAI, Type } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey });

async function f() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: 'Ekstrak data: "Saya mau jual cabai merah 50kg harga 30000 di Magelang"',
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        commodity: { type: Type.STRING },
                        qty: { type: Type.NUMBER },
                        price: { type: Type.NUMBER },
                        location: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['SUPPLY', 'DEMAND'] }
                    },
                    required: ['commodity', 'qty', 'price', 'location', 'type']
                }
            }
        });
        console.log("Success:\n", response.text);
    } catch (e) {
        console.error('ERROR:\n', e);
    }
}
f();
