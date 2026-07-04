import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// @ts-ignore
import midtransClient from "midtrans-client";

// Midtrans configuration
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

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
      include: { 
        buyer: true,
        items: true
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Cek apakah payment sudah ada dan statusnya pending
    let payment = await prisma.payment.findUnique({
      where: { orderId: orderId },
    });

    if (payment && payment.snapToken && (payment.status === "PENDING" || payment.status === "DENY")) {
        // Return existing snap token if it exists and is still pending
        return NextResponse.json({ 
            token: payment.snapToken, 
            redirect_url: payment.snapUrl,
            midtransOrderId: payment.midtransOrderId
        });
    }

    // Generate unique midtrans order ID based on internal orderId + timestamp
    // (To avoid duplicate order ID error in Midtrans if user retries)
    const midtransOrderId = `${order.id}-${Date.now()}`;

    // Item details mapping
    const itemDetails = order.items.map(item => ({
      id: item.id,
      price: Number(item.price),
      quantity: Number(item.qty),
      name: item.commodity,
    }));

    // Tambah ongkir jika ada
    if (Number(order.shippingCost) > 0) {
      itemDetails.push({
        id: "SHIPPING",
        price: Number(order.shippingCost),
        quantity: 1,
        name: `Ongkos Kirim (${order.courier})`,
      });
    }

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Number(order.totalAmount),
      },
      customer_details: {
        first_name: order.buyer?.name || "Pembeli",
        email: order.buyer?.email || "buyer@tumbasna.com",
        phone: order.buyer?.phoneNumber || "",
      },
      item_details: itemDetails,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/pesanan/${order.id}`
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    // Simpan data payment ke DB
    if (payment) {
        // Update
        payment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                midtransOrderId: midtransOrderId,
                snapToken: transaction.token,
                snapUrl: transaction.redirect_url,
                grossAmount: Number(order.totalAmount),
                status: "PENDING",
            }
        });
    } else {
        // Create new
        payment = await prisma.payment.create({
          data: {
            orderId: order.id,
            midtransOrderId: midtransOrderId,
            grossAmount: Number(order.totalAmount),
            snapToken: transaction.token,
            snapUrl: transaction.redirect_url,
            status: "PENDING",
          },
        });
    }

    return NextResponse.json({ 
        token: transaction.token, 
        redirect_url: transaction.redirect_url,
        midtransOrderId: midtransOrderId
    });
  } catch (error: any) {
    console.error("[Midtrans Create Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment" }, { status: 500 });
  }
}
