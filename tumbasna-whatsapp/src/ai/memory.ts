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
    
    // Ambil history saat ini dari memory fallback untuk mencari metadata
    const currentHistory = memoryFallback.get(phoneNumber) || [];
    const metadataList = currentHistory.filter((msg: any) => msg.role === 'metadata');
    
    let nextHistory = [...historyJson];
    
    if (isCompletedOrCancelled) {
        // Keep last 10 messages for context, plus metadata
        const recentMessages = nextHistory.slice(-10);
        const mappedPhoneMeta = metadataList.find((msg: any) => msg.mappedPhone);
        nextHistory = mappedPhoneMeta ? [mappedPhoneMeta, ...recentMessages] : recentMessages;
        memoryFallback.set(phoneNumber, nextHistory);
    } else {
        // Gabungkan metadata yang ada saat ini ke history baru jika belum ada
        for (const meta of metadataList) {
            if (!nextHistory.some((msg: any) => msg.role === 'metadata' && JSON.stringify(msg) === JSON.stringify(meta))) {
                nextHistory.unshift(meta);
            }
        }
        memoryFallback.set(phoneNumber, nextHistory);
    }

    try {
        if (nextHistory.length === 0) {
            await axios.post(`${dashboardApiUrl}/api/session`, { 
                phone: phoneNumber, 
                action: 'DELETE' 
            }, { timeout: 5000 });
        } else {
            await axios.post(`${dashboardApiUrl}/api/session`, { 
                phone: phoneNumber, 
                history: nextHistory 
            }, { timeout: 5000 });
        }
        console.log(`✅ [MEMORY SUCCESS] History updated for ${phoneNumber}`);
    } catch (e: any) {
        console.warn(`⚠️ [MEMORY] Gagal simpan ke DB (in-memory aktif): ${e.message}`);
    }
}

/**
 * Menyimpan metadata tertentu ke dalam chat history session.
 */
export async function saveMetadata(sender: string, metaToUpdate: { mappedPhone?: string; lastImageUrl?: string | null }) {
    const phoneNumber = sender.split('@')[0];
    const history = await getSessionHistory(sender);
    
    // Cari index metadata yang sudah ada
    const index = history.findIndex((msg: any) => msg.role === 'metadata');
    
    if (index >= 0) {
        history[index] = {
            ...history[index],
            ...metaToUpdate
        };
        // Hapus key jika nilainya null untuk kebersihan data
        if (metaToUpdate.lastImageUrl === null) {
            delete history[index].lastImageUrl;
        }
    } else {
        const newMeta: any = { role: 'metadata', ...metaToUpdate };
        if (newMeta.lastImageUrl === null) {
            delete newMeta.lastImageUrl;
        }
        history.unshift(newMeta);
    }
    
    // Simpan history kembali
    await saveSessionHistory(sender, history, false);
    console.log(`🔗 [METADATA SAVED] ${phoneNumber}:`, JSON.stringify(metaToUpdate));
}

/**
 * Mengambil nomor telepon efektif setelah mapping dari LID.
 */
export async function getEffectivePhoneNumber(sender: string): Promise<string> {
    const phoneNumber = sender.split('@')[0];
    const history = await getSessionHistory(sender);
    const metadata = history.find((msg: any) => msg.role === 'metadata');
    if (metadata && metadata.mappedPhone) {
        console.log(`🔗 [METADATA ROUTING] JID ${sender} -> Real Phone: ${metadata.mappedPhone}`);
        return metadata.mappedPhone;
    }
    return phoneNumber;
}

/**
 * Mengambil URL foto produk terakhir yang diunggah dalam sesi ini.
 */
export async function getLastImageUrl(sender: string): Promise<string | null> {
    const history = await getSessionHistory(sender);
    const metadata = history.find((msg: any) => msg.role === 'metadata');
    return metadata?.lastImageUrl || null;
}


