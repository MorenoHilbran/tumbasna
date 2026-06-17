import { WAMessageContent } from '@whiskeysockets/baileys';

/** Extract text from various message types */
export function extractText(message: WAMessageContent | undefined | null): string | null {
    if (!message) return null;
    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        null
    );
}
