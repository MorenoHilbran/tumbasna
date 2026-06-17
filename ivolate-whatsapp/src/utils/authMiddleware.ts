import { Request, Response, NextFunction } from 'express';

/**
 * Middleware untuk memvalidasi Secret Key di Header.
 * Mendukung format: 
 * 1. x-secret-key: [key]
 * 2. Authorization: Bearer [key]
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Ambil dari .env, kalau tidak ada, pakai hardcode (sebagai fallback sesuai permintaan)
    const secretKey = process.env.IVOLATE_SECRET_KEY || "ivolate-rahasia-banget";
    
    // 1. Cek x-secret-key header
    let providedKey = req.headers['x-secret-key'] as string;

    // 2. Cek Authorization: Bearer header (seperti yang diminta: Kayak pake Bearer api)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.substring(7);
    }

    if (!providedKey || providedKey !== secretKey) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized: Invalid or missing secret key (x-secret-key or Bearer token)' 
        });
    }

    next();
};
