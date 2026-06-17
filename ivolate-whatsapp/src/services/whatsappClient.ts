/**
 * WhatsApp Client Singleton Service
 * Berfungsi menyimpan sesi aktif socket Baileys serta status QR terkini.
 */

interface WhatsAppState {
    sock: any;
    qr: string | null;
    status: 'initial' | 'connecting' | 'qr' | 'open' | 'close';
}

const state: WhatsAppState = {
    sock: null,
    qr: null,
    status: 'initial'
};

export const setSock = (sock: any) => {
    state.sock = sock;
};

export const clearSock = () => {
    state.sock = null;
    state.qr = null;
    state.status = 'close';
};

export const getSock = () => state.sock;

export const setQR = (qr: string | null) => {
    state.qr = qr;
};

export const getQR = () => state.qr;

export const setStatus = (status: WhatsAppState['status']) => {
    state.status = status;
};

export const getStatus = () => state.status;
