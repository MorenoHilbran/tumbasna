import { Router, Request, Response } from 'express';
import { getSock, clearSock, getQR, getStatus } from '../services/whatsappClient';
import { processIncomingMessage } from '../handlers/messageHandler';
import { connectWhatsApp } from '../bot/baileys';
import { authMiddleware } from '../utils/authMiddleware';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'tumbasna-whatsapp' });
});

// ─── AUTH ENDPOINTS ───────────────────────────────────────

// Get session status & QR
router.get('/api/auth/status', authMiddleware, async (req: Request, res: Response) => {
    const status = getStatus();
    const qr = getQR();
    
    let qrBase64 = null;
    if (qr) {
        qrBase64 = await QRCode.toDataURL(qr);
    }

    res.json({ 
        success: true, 
        status, 
        qr: qr || null,
        qr_image: qrBase64,
        message: status === 'open' ? 'Connected' : (qr ? 'Scan this QR' : 'Disconnected')
    });
});

// Get raw QR image
router.get('/api/auth/qr-image', authMiddleware, async (req: Request, res: Response) => {
    const qr = getQR();
    if (!qr) {
        return res.status(404).json({ success: false, message: 'QR code not available' });
    }

    try {
        const imgBuffer = await QRCode.toBuffer(qr);
        res.setHeader('Content-Type', 'image/png');
        res.send(imgBuffer);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Login (Start Bot)
router.post('/api/auth/login', authMiddleware, async (req: Request, res: Response) => {
    const status = getStatus();
    
    if (status === 'open') {
        return res.json({ success: true, message: 'WhatsApp is already connected' });
    }

    try {
        // Jika sedang ada QR, kirimkan saja QR-nya
        const currentQR = getQR();
        if (currentQR) {
            const qrBase64 = await QRCode.toDataURL(currentQR);
            return res.json({ 
                success: true, 
                status: 'qr', 
                qr: currentQR, 
                qr_image: qrBase64,
                message: 'Please scan the QR code' 
            });
        }

        // Start connection process
        connectWhatsApp(); 
        res.json({ success: true, message: 'Starting WhatsApp connection...', status: 'connecting' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logout (Stop Bot and Clear Session)
router.post('/api/auth/logout', authMiddleware, async (req: Request, res: Response) => {
    const sock = getSock();
    
    try {
        if (sock) {
            try {
                await sock.logout();
                sock.end(undefined);
            } catch (err) {
                console.warn('Socket logout/end failed, continuing with cleanup:', err);
            }
            clearSock();
        }

        // Hapus isi folder session agar benar-benar "fresh start"
        // Kita tidak hapus foldernya sendiri karena di Docker ini adalah mount point (EBUSY)
        const sessionPath = path.join(process.cwd(), 'session');
        if (fs.existsSync(sessionPath)) {
            const files = fs.readdirSync(sessionPath);
            for (const file of files) {
                fs.rmSync(path.join(sessionPath, file), { recursive: true, force: true });
            }
            console.log('🗑️ Isi folder session dibersihkan.');
        }

        res.json({ success: true, message: 'Bot logged out and session cleared' });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint eksperimentasi tanpa scan barcode (tetap dibiarkan untuk testing internal)
router.post('/test/simulate-message', async (req: Request, res: Response) => {
    const { sender, pushName, text } = req.body;
    console.log('\n[SIMULASI REST CLIENT] ───────────────────');
    console.log(`📩 Pesan masuk: ${text}`);

    try {
        const mockSendMessage = async (jid: string, content: any) => {
            console.log(`💬 Balasan bot ke ${jid}:`, content.text);
            return true;
        };
        await processIncomingMessage(sender, pushName, text, mockSendMessage);
        res.json({ success: true, message: 'Simulasi pesan selesai diproses' });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Push notification webhook
router.post('/api/send', authMiddleware, async (req: Request, res: Response) => {
    const { phone, message } = req.body;
    const sock = getSock();
    
    if (!sock) {
        return res.status(503).json({ success: false, error: 'WhatsApp bot is not ready' });
    }
    
    if (!phone || !message) {
        return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    try {
        let cleanPhone = phone.split('@')[0].replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        } else if (cleanPhone.length > 0 && !cleanPhone.startsWith('62')) {
            cleanPhone = '62' + cleanPhone;
        }
        const jid = `${cleanPhone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true, message: 'Pesan terkirim' });
    } catch (error: any) {
        console.error('Gagal mengirim pesan push:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
