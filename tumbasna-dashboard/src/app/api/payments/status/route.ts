import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MIDTRANS_BASE = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";
const AUTH_HEADER = "Basic " + Buffer.from((process.env.MIDTRANS_SERVER_KEY || "") + ":").toString("base64");

// GET /api/payments/status?midtransOrderId=xxx
// Polling dari mobile untuk cek apakah QRIS sudah dibayar
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const midtransOrderId = searchParams.get("midtransOrderId");

    if (!midtransOrderId) {
      return NextResponse.json({ error: "Missing midtransOrderId" }, { status: 400 });
    }

    // Cek status ke Midtrans API
    const midtransRes = await fetch(`${MIDTRANS_BASE}/v2/${midtransOrderId}/status`, {
      headers: { Authorization: AUTH_HEADER },
    });
    const data = await midtransRes.json();

    const transactionStatus = data.transaction_status;
    const isPaid = transactionStatus === "settlement" || transactionStatus === "capture";

    return NextResponse.json({
      transactionStatus,
      isPaid,
      grossAmount: data.gross_amount,
      orderId: data.order_id,
    });
  } catch (error: any) {
    console.error("[Payment Status Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
