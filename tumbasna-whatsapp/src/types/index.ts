export interface ParsedItem {
    commodity: string;
    weight_kg: number;
    price: number;
    location: string;
    image_url?: string | null;
    pending_approval?: boolean;
}

export interface ParsedData {
    intent: "SUPPLY" | "DEMAND" | "CANCEL" | "INQUIRY" | "UNKNOWN" | "LIST" | "REGISTER" | "STATUS" | "EDIT" | "COMMODITY_REQUEST";
    items: ParsedItem[];
    supplier_name?: string | null;
    supplier_location?: string | null;
    business_name?: string | null;
    farm_name?: string | null;
    contact_phone?: string | null;
    new_phone?: string | null;
    bank_name?: string | null;
    bank_account?: string | null;
    photo_requested?: boolean;
    status: "COMPLETE" | "INCOMPLETE" | "WARNING" | "PENDING_COMMODITY_APPROVAL";
    reply_message: string;
}
