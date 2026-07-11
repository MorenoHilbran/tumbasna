import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Midtrans Core API — QRIS Only
const MIDTRANS_BASE = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

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

    // Jika sudah ada payment aktif yang masih pending, kembalikan QR yang lama
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === "PENDING" && existingPayment.snapToken) {
      // snapToken kita gunakan untuk menyimpan qrString di mode QRIS
      return NextResponse.json({
        qrString: existingPayment.snapToken,
        midtransOrderId: existingPayment.midtransOrderId,
        grossAmount: Number(existingPayment.grossAmount),
      });
    }

    // Generate unique Midtrans order ID
    const midtransOrderId = `${order.id}-${Date.now()}`;
    const grossAmount = Number(order.totalAmount);

    // Panggil Core API Midtrans — QRIS charge
    const chargePayload = {
      payment_type: "qris",
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: order.buyer?.name || "Pembeli",
        email: order.buyer?.email || "buyer@tumbasna.com",
        phone: order.buyer?.phoneNumber || "",
      },
      item_details: [
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
      ],
    };

    const midtransRes = await fetch(`${MIDTRANS_BASE}/v2/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(chargePayload),
    });

    const midtransData = await midtransRes.json();

    if (!midtransRes.ok || midtransData.status_code !== "201") {
      console.error("[MIDTRANS QRIS ERROR]", midtransData);
      return NextResponse.json(
        { error: midtransData.status_message || "Midtrans error" },
        { status: 500 }
      );
    }

    // Ambil QR string dari response Midtrans
    const qrString =
      midtransData.qr_string ||
      midtransData.actions?.find((a: any) => a.name === "generate-qr-code")?.url ||
      "";

    // Simpan/update payment di DB
    // Gunakan snapToken untuk menyimpan qrString (kolom yg sudah ada, tanpa migrasi)
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          midtransOrderId,
          snapToken: qrString,          // reuse kolom snapToken untuk qrString
          snapUrl: midtransData.redirect_url || null,
          grossAmount,
          status: "PENDING",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          midtransOrderId,
          grossAmount,
          snapToken: qrString,          // reuse kolom snapToken untuk qrString
          snapUrl: midtransData.redirect_url || null,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({
      qrString,
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
