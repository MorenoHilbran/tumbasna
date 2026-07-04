import axios from 'axios';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3000';

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
            const response = await axios.post(`${API_URL}/api/supply`, data);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengirim data SUPPLY:`, error.message);
            throw error;
        }
    },

    async sendDemand(data: ApiPayload) {
        try {
            const response = await axios.post(`${API_URL}/api/demand`, data);
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengirim data DEMAND:`, error.message);
            throw error;
        }
    },

    async getUserEntries(phone: string) {
        try {
            const response = await axios.get(`${API_URL}/api/entries`, {
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
            const response = await axios.get(`${API_URL}/api/user/whitelist`, {
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
            const response = await axios.get(`${API_URL}/api/orders`, {
                params: { phone }
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal mengambil data ORDERS (URL: ${API_URL}/api/orders):`, error.message);
            return { success: false, data: [] };
        }
    },
    async registerSupplier(data: { phone: string; name: string; location: string }) {
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                phone: data.phone,
                ownerName: data.name,
                businessName: data.name,
                address: data.location,
                businessType: 'Supplier Pertanian',
                role: 'PETANI',
                email: '',
                bankName: '',
                bankAccount: '',
            });
            return response.data;
        } catch (error: any) {
            console.error(`[API ERROR] Gagal registrasi supplier:`, error.message);
            throw error;
        }
    },
};
