import { extractMessageData } from './src/lib/gemini';
import { config } from 'dotenv';
config();

async function run() {
    const result = await extractMessageData('Saya mau jual cabai merah 50kg harga 30000 di Magelang');
    console.log("Extracted Data:", result);
    console.log("Type of qty:", typeof result.qty);
    console.log("Type of price:", typeof result.price);
    console.log("Value of qty:", result.qty);
    console.log("Value of price:", result.price);
}

run();
