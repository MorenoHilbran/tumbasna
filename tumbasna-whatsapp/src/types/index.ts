export interface ParsedItem {
    commodity: string;
    weight_kg: number;
    price: number;
    location: string;
}

export interface ParsedData {
    intent: "SUPPLY" | "DEMAND" | "CANCEL" | "INQUIRY" | "UNKNOWN" | "LIST";
    items: ParsedItem[];
    contact_phone?: string;
    status: "COMPLETE" | "INCOMPLETE" | "WARNING";
    reply_message: string;
}
