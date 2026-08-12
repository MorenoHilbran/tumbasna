import axios from 'axios';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3000';

// Instance axios dengan timeout agar bot tidak gantung jika dashboard bermasalah
const apiClient = axios.create({
    timeout: 5000, // 5 detik timeout
});

export interface ApiPayload {
    phone: string;
    commodity: string;
    volume: number;
    price: number;
    location: string;
    image?: string | null;
    lat?: number | null;
    lng?: number | null;
}

export const apiService = {
    async sendSupply(data: ApiPayload) {
        try {
            const response = await apiClient.post(`${API_URL}/api/supply`, data);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengirim data SUPPLY:`, error.message);
            throw error;
        }
    },

    async sendDemand(data: ApiPayload) {
        try {
            const response = await apiClient.post(`${API_URL}/api/demand`, data);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengirim data DEMAND:`, error.message);
            throw error;
        }
    },

    async getUserEntries(phone: string) {
        try {
            const response = await apiClient.get(`${API_URL}/api/entries`, {
                params: { phone }
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengambil data ENTRIES:`, error.message);
            throw error;
        }
    },

    async checkWhitelist(phone: string) {
        try {
            const response = await apiClient.get(`${API_URL}/api/user/whitelist`, {
                params: { phone }
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal check whitelist (URL: ${API_URL}/api/user/whitelist):`, error.message);
            return { success: false, isWhitelisted: false };
        }
    },
    async getSupplierOrders(phone: string) {
        try {
            const response = await apiClient.get(`${API_URL}/api/orders`, {
                params: { phone }
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengambil data ORDERS (URL: ${API_URL}/api/orders):`, error.message);
            return { success: false, data: [] };
        }
    },
    async registerSupplier(data: { phone: string; name: string; businessName?: string; location: string; bankName?: string; bankAccount?: string; lat?: number | null; lng?: number | null; nibUrl?: string | null }) {
        try {
            const response = await apiClient.post(`${API_URL}/api/auth/register`, {
                phone: data.phone,
                ownerName: data.name,
                businessName: data.businessName || data.name,
                address: data.location,
                businessType: 'Supplier Pertanian',
                role: 'PETANI',
                email: '',
                bankName: data.bankName || '',
                bankAccount: data.bankAccount || '',
                lat: data.lat,
                lng: data.lng,
                nibUrl: data.nibUrl || null,
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal registrasi supplier:`, error.message);
            throw error;
        }
    },
    async updateUserProfile(data: { phone: string; newPhone?: string; name?: string; location?: string; bankName?: string; bankAccount?: string }) {
        try {
            const response = await apiClient.post(`${API_URL}/api/auth/update`, {
                phone: data.phone,
                ...(data.newPhone && { newPhone: data.newPhone }),
                ...(data.name && { name: data.name, businessName: data.name }),
                ...(data.location && { address: data.location }),
                ...(data.bankName && { bankName: data.bankName }),
                ...(data.bankAccount && { bankAccount: data.bankAccount }),
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal update profil supplier:`, error.message);
            throw error;
        }
    },
    async getSettings() {
        try {
            const response = await apiClient.get(`${API_URL}/api/dashboard/settings`);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengambil pengaturan:`, error.message);
            return null;
        }
    },
    async updateOrderStatus(id: string, status: string, trackingTimeline?: any[], waybillInfo?: { waybillNumber?: string; waybillCourier?: string; waybillImageUrl?: string }) {
        try {
            const response = await apiClient.patch(`${API_URL}/api/orders/${id}`, {
                status,
                ...(trackingTimeline && { trackingTimeline }),
                ...(waybillInfo?.waybillNumber && { waybillNumber: waybillInfo.waybillNumber }),
                ...(waybillInfo?.waybillCourier && { waybillCourier: waybillInfo.waybillCourier }),
                ...(waybillInfo?.waybillImageUrl && { waybillImageUrl: waybillInfo.waybillImageUrl }),
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal update order status:`, error.message);
            throw error;
        }
    },
    async getOrderById(id: string) {
        try {
            const response = await apiClient.get(`${API_URL}/api/orders/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengambil detail order ${id}:`, error.message);
            return null;
        }
    },
    async submitCommodityRequest(data: { commodityName: string; supplierPhone: string; supplierName?: string; weightKg?: number; pricePerKg?: number; location?: string; category?: string }) {
        try {
            const response = await apiClient.post(`${API_URL}/api/commodity-request`, data);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal submit commodity request:`, error.message);
            throw error;
        }
    },
    async getRecentChatsForSupplier(supplierPhone: string) {
        try {
            const response = await apiClient.get(`${API_URL}/api/chat/suppliers/recent`, {
                params: { supplierPhone }
            });
            return response.data.data || [];
        } catch (error: any) {
            console.error(`[API ERROR] Gagal get recent chats for supplier:`, error.message);
            return [];
        }
    },
    async getChatHistory(buyerPhone: string, supplierPhone: string) {
        try {
            const response = await apiClient.get(`${API_URL}/api/chat/suppliers`, {
                params: { action: 'history', buyerPhone, supplierPhone }
            });
            return response.data.data || [];
        } catch (error: any) {
            console.error(`[API ERROR] Gagal get chat history:`, error.message);
            return [];
        }
    },
    async saveChatMessage(data: { buyerPhone: string; supplierPhone: string; message: string; sender: 'buyer' | 'supplier' }) {
        try {
            const response = await apiClient.post(`${API_URL}/api/chat/suppliers`, data);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal save chat message:`, error.message);
            throw error;
        }
    },
    async deleteUserAccount(phone: string) {
        try {
            const response = await apiClient.post(`${API_URL}/api/users/delete`, { phone });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal hapus akun ${phone}:`, error.response?.data || error.message);
            return error.response?.data || { success: false, error: error.message };
        }
    },
    async deleteCommodityEntry(entryId: string, phone: string) {
        try {
            const response = await apiClient.post(`${API_URL}/api/entries/delete`, { entryId, phone });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal hapus produk ${entryId}:`, error.response?.data || error.message);
            return error.response?.data || { success: false, error: error.message };
        }
    },
};


