export interface ParsedItem {
    commodity: string;
    weight_kg: number;
    price: number;
    location: string;
}

export interface ParsedData {
    intent: "SUPPLY" | "DEMAND" | "CANCEL" | "INQUIRY" | "UNKNOWN" | "LIST" | "REGISTER" | "STATUS";
    items: ParsedItem[];
    supplier_name?: string | null;
    supplier_location?: string | null;
    contact_phone?: string | null;
    bank_name?: string | null;
    bank_account?: string | null;
    status: "COMPLETE" | "INCOMPLETE" | "WARNING";
    reply_message: string;
}
