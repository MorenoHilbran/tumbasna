import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connectWhatsApp } from './bot/baileys';
import appRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use('/', appRoutes);

const startBot = async () => {
    try {
        await connectWhatsApp();
    } catch (error) {
        console.error('Failed to start WhatsApp bot:', error);
    }
};
startBot();

app.listen(PORT, () => {
    console.log(`🤖 ivolate-whatsapp running on http://localhost:${PORT}`);
});
