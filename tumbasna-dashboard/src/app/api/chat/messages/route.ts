import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/chat/messages?buyerPhone=628xxxx
// Fetch all chat messages for a buyer, grouped by supplier
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerPhone = searchParams.get('buyerPhone');
    const since = searchParams.get('since'); // ISO timestamp for polling

    if (!buyerPhone) {
      return NextResponse.json(
        { success: false, error: 'buyerPhone is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find buyer
    const buyer = await prisma.user.findUnique({
      where: { phoneNumber: buyerPhone },
    });

    if (!buyer) {
      return NextResponse.json(
        { success: true, data: [] },
        { headers: corsHeaders }
      );
    }

    // Build where clause
    const where: any = {
      buyerUserId: buyer.id,
    };

    // If 'since' is provided, only fetch messages newer than that timestamp
    if (since) {
      where.createdAt = { gt: new Date(since) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Group messages by supplierName (which stores the supplier phone number)
    const grouped: Record<string, any[]> = {};
    for (const msg of messages) {
      const key = msg.supplierName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        status: msg.status,
        timestamp: msg.createdAt.toISOString(),
      });
    }

    // Resolve supplier names from phone numbers
    const supplierPhones = Object.keys(grouped);
    const suppliers = await prisma.user.findMany({
      where: { phoneNumber: { in: supplierPhones } },
      select: { phoneNumber: true, name: true, businessName: true },
    });

    const phoneToName: Record<string, string> = {};
    for (const s of suppliers) {
      phoneToName[s.phoneNumber] = s.businessName || s.name || `Supplier ${s.phoneNumber}`;
    }

    const threads = supplierPhones.map((phone) => ({
      supplierPhone: phone,
      supplierName: phoneToName[phone] || `Supplier ${phone}`,
      messages: grouped[phone],
    }));

    return NextResponse.json(
      { success: true, data: threads },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[CHAT MESSAGES GET ERROR]', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
