import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Midtrans Snap API
const MIDTRANS_SNAP_BASE = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const AUTH_HEADER = "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Ambil detail order dari database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Jika sudah ada payment aktif yang masih pending DAN punya snapUrl, kembalikan snap URL yang lama
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === "PENDING" && existingPayment.snapUrl) {
      return NextResponse.json({
        snapUrl: existingPayment.snapUrl,
        snapToken: existingPayment.snapToken,
        midtransOrderId: existingPayment.midtransOrderId,
        grossAmount: Number(existingPayment.grossAmount),
      });
    }

    // Generate unique Midtrans order ID
    const midtransOrderId = `${order.id}-${Date.now()}`;
    const grossAmount = Number(order.totalAmount);

    // Build item details
    const itemDetails = [
      ...order.items.map((item) => ({
        id: item.id,
        price: Number(item.price),
        quantity: Number(item.qty),
        name: item.commodity
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      })),
      ...(Number(order.shippingCost) > 0
        ? [{
            id: "SHIPPING",
            price: Number(order.shippingCost),
            quantity: 1,
            name: `Ongkos Kirim (${order.courier})`,
          }]
        : []),
      {
        id: "SERVICE_FEE",
        price: 2000,
        quantity: 1,
        name: "Biaya Layanan Aplikasi",
      },
    ];

    // Panggil Snap API Midtrans
    const snapPayload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: order.buyer?.name || "Pembeli",
        email: order.buyer?.email || "buyer@tumbasna.com",
        phone: order.buyer?.phoneNumber || "",
      },
      item_details: itemDetails,
      credit_card: {
        secure: true,
      },
    };

    const snapRes = await fetch(`${MIDTRANS_SNAP_BASE}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(snapPayload),
    });

    const snapData = await snapRes.json();

    if (!snapRes.ok || !snapData.token) {
      console.error("[MIDTRANS SNAP ERROR]", snapData);
      return NextResponse.json(
        { error: snapData.error_messages?.[0] || snapData.message || "Midtrans Snap error" },
        { status: 500 }
      );
    }

    const snapToken = snapData.token;
    const snapUrl = snapData.redirect_url;

    // Simpan/update payment di DB (upsert agar tidak crash jika payment sudah ada)
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        midtransOrderId,
        snapToken,
        snapUrl,
        grossAmount,
        status: "PENDING",
      },
      create: {
        orderId: order.id,
        midtransOrderId,
        grossAmount,
        snapToken,
        snapUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      snapToken,
      snapUrl,
      midtransOrderId,
      grossAmount,
    });
  } catch (error: any) {
    console.error("[Payment Create Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
