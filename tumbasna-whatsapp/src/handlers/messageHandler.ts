import { AnyMessageContent } from '@whiskeysockets/baileys';
import { extractMessageData } from '../ai/agent';
import { apiService } from '../services/apiService';

export async function processIncomingMessage(
    sender: string,
    pushName: string,
    text: string,
    sendMessage: (jid: string, content: AnyMessageContent) => Promise<any>
) {
    // Whitelist Check Disabled - Allow all numbers
    const phoneNumber = sender.split('@')[0];
    console.log(`[ACCESS] Menanggapi pesan dari nomor: ${phoneNumber}`);
    // No more restriction checking here. All users are now permitted.

    console.log(`[AI PROCESSING] Menganalisis pesan dari ${pushName}: "${text}"`);
    
    try {
        const parsedData = await extractMessageData(sender, text);
        let anyMatched = false;
        let matchedPhoneDetails = '';

        // 1. Process items if intent is SUPPLY or DEMAND and status is COMPLETE/WARNING
        if (
            (parsedData.intent === 'SUPPLY' || parsedData.intent === 'DEMAND') && 
            (parsedData.status === 'COMPLETE' || parsedData.status === 'WARNING') && 
            parsedData.items.length > 0
        ) {
            
            for (const item of parsedData.items) {
                console.log(`[ITEM] ${item.commodity} | ${item.weight_kg}kg | Rp${item.price} | ${item.location}`);
                
                let cleanContactPhone = parsedData.contact_phone ? parsedData.contact_phone.replace(/\D/g, '') : '';
                // Standardize to 628 format for wa.me URL correctness
                if (cleanContactPhone.startsWith('0')) {
                    cleanContactPhone = '62' + cleanContactPhone.substring(1);
                }
                
                const payload = {
                    phone: cleanContactPhone || sender.split('@')[0],
                    commodity: item.commodity,
                    volume: item.weight_kg,
                    price: item.price,
                    location: item.location,
                };

                try {
                    let apiResult;
                    if (parsedData.intent === 'SUPPLY') {
                        apiResult = await apiService.sendSupply(payload);
                    } else {
                        apiResult = await apiService.sendDemand(payload);
                    }

                    if (apiResult?.matched) {
                        anyMatched = true;
                        if (apiResult.matched.user && apiResult.matched.user.phoneNumber) {
                            matchedPhoneDetails += `\n- ${item.commodity}: wa.me/${apiResult.matched.user.phoneNumber}`;
                        }
                    }
                } catch (error: any) {
                    console.error(`❌ [ERROR API] Gagal mengirim item ${item.commodity}:`, error.message);
                }
            }
        }

        // 2. Process LIST intent
        if (parsedData.intent === 'LIST') {
            const listPhoneNumber = sender.split('@')[0];
            try {
                const result = await apiService.getUserEntries(listPhoneNumber);
                if (result.success && result.data.length > 0) {
                    let listText = `📋 *DAFTAR CATATAN ANDA*\n\n`;
                    result.data.forEach((entry: any, index: number) => {
                        const statusEmoji = entry.status === 'MATCHED' ? '✅' : entry.status === 'ACTIVE' ? '⏳' : '🏁';
                        const typeLabel = entry.type === 'SUPPLY' ? 'Penawaran' : 'Permintaan';
                        listText += `${index + 1}. [${statusEmoji} ${entry.status}] *${typeLabel}*\n   📦 ${entry.commodity}\n   ⚖️ ${entry.qty}kg\n   💰 Rp${entry.price.toLocaleString('id-ID')}\n   📍 ${entry.location}\n\n`;
                    });
                    listText += `_Status: ⏳ Aktif | ✅ Match | 🏁 Selesai_`;
                    parsedData.reply_message = listText;
                } else {
                    parsedData.reply_message = "Anda belum memiliki catatan transaksi di sistem kami.";
                }
            } catch (error) {
                console.error(`❌ [ERROR LIST] Gagal mengambil list:`, error);
                parsedData.reply_message = "Maaf, saya gagal mengambil daftar catatan Anda. Silakan coba lagi nanti.";
            }
        }

        // 3. Build final reply
        let finalReply = parsedData.reply_message;

        // 3. Add Match Info if any item matched
        if (anyMatched) {
            finalReply += '\n\n🎉 *KABAR BAIK!* Kami langsung menemukan kecocokan yang pas untuk Anda di sistem!';
            if (matchedPhoneDetails) {
                 finalReply += `\nSilakan klik nomor kontak partner Anda di bawah ini untuk berkoordinasi:${matchedPhoneDetails}`;
            }
        }

        // 4. Send reply
        await sendMessage(sender, { text: finalReply });
        console.log(`💬 Balasan dikirim ke ${sender} (Intent: ${parsedData.intent}, Status: ${parsedData.status})`);

    } catch (parseError: any) {
        console.error(`❌ [ERROR] Processing gagal:`, parseError.message);
        await sendMessage(sender, { text: 'Maaf, terjadi kesalahan teknis. Mohon coba lagi nanti.' });
    }
}
