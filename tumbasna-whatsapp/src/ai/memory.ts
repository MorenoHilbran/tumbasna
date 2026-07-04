import axios from 'axios';

const dashboardApiUrl = process.env.API_URL || "http://127.0.0.1:3000";

// ── In-Memory Fallback (digunakan saat DB tidak tersedia) ──────────────────
// Key: phoneNumber, Value: array of history messages
const memoryFallback = new Map<string, any[]>();

/**
 * Mengambil histori percakapan dari Next.js Dashboard (PostgreSQL).
 * Jika DB error, gunakan in-memory fallback agar percakapan tetap berjalan.
 */
export async function getSessionHistory(sender: string): Promise<any[]> {
    const phoneNumber = sender.split('@')[0];
    try {
        const res = await axios.get(`${dashboardApiUrl}/api/session`, {
            params: { phone: phoneNumber },
            timeout: 5000
        });
        
        if (res.status === 200 && Array.isArray(res.data.history)) {
            // Sync ke fallback juga
            memoryFallback.set(phoneNumber, res.data.history);
            console.log(`✅ [MEMORY] Histori ditarik untuk ${phoneNumber}: ${res.data.history.length} pesan`);
            return res.data.history;
        }
    } catch (e: any) {
        console.warn(`⚠️ [MEMORY] DB tidak tersedia, gunakan in-memory fallback untuk ${phoneNumber}`);
    }
    
    // Fallback: gunakan in-memory
    const fallback = memoryFallback.get(phoneNumber) || [];
    console.log(`📝 [MEMORY FALLBACK] ${phoneNumber}: ${fallback.length} pesan dari memory`);
    return fallback;
}

/**
 * Menyimpan array histori percakapan kembali ke Dashboard.
 * Selalu update in-memory fallback juga.
 */
export async function saveSessionHistory(sender: string, historyJson: any[], isCompletedOrCancelled: boolean) {
    const phoneNumber = sender.split('@')[0];
    
    if (isCompletedOrCancelled) {
        // Reset memory
        memoryFallback.delete(phoneNumber);
    } else {
        // Update in-memory fallback DULU (tidak perlu tunggu DB)
        memoryFallback.set(phoneNumber, historyJson);
    }

    try {
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
        // Tidak fatal — in-memory fallback sudah diupdate
        console.warn(`⚠️ [MEMORY] Gagal simpan ke DB (in-memory aktif): ${e.message}`);
    }
}
