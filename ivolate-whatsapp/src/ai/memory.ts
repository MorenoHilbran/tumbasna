import axios from 'axios';

const dashboardApiUrl = process.env.API_URL || "http://127.0.0.1:3000";

/**
 * Mengambil histori percakapan dari Next.js Dashboard (PostgreSQL)
 */
export async function getSessionHistory(sender: string): Promise<any[]> {
    try {
        const phoneNumber = sender.split('@')[0];
        const res = await axios.get(`${dashboardApiUrl}/api/session`, {
            params: { phone: phoneNumber },
            timeout: 5000
        });
        
        if (res.status === 200) {
            console.log(`✅ [MEMORY] Histori ditarik untuk ${phoneNumber}: ${res.data.history?.length || 0} pesan`);
            return res.data.history || [];
        }
    } catch (e: any) {
        console.error(`❌ [MEMORY ERROR] Gagal menarik chat history untuk ${sender}:`, e.message);
    }
    return [];
}

/**
 * Menyimpan array histori percakapan kembali ke Dashboard.
 * Jika status transaksi sudah COMPLETE atau CANCEL, hapus memory.
 */
export async function saveSessionHistory(sender: string, historyJson: any[], isCompletedOrCancelled: boolean) {
    try {
        const phoneNumber = sender.split('@')[0];
        if (isCompletedOrCancelled) {
            await axios.post(`${dashboardApiUrl}/api/session`, { 
                phone: phoneNumber, 
                action: 'DELETE' 
            }, { timeout: 5000 });
        } else {
             await axios.post(`${dashboardApiUrl}/api/session`, { 
                phone: phoneNumber, 
                history: historyJson 
            }, { timeout: 5000 });
        }
        console.log(`✅ [MEMORY SUCCESS] History updated for ${phoneNumber}`);
    } catch (e: any) {
        console.error("❌ [MEMORY ERROR] Gagal menyimpan ChatSession ke DB:", e.message);
    }
}
