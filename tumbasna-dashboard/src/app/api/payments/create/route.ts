import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Midtrans Snap API
const MIDTRANS_SNAP_BASE = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const AUTH_HEADER = "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, items, customerName, customerEmail, customerPhone } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400, headers: corsHeaders });
    }

    // Ambil detail order dari database jika ada
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, items: true },
    });

    let grossAmount = 0;
    let itemDetails: any[] = [];
    let buyerName = customerName || "Pembeli Tumbasna";
    let buyerEmail = customerEmail || "buyer@tumbasna.com";
    let buyerPhone = customerPhone || "";

    if (order) {
      grossAmount = Number(order.totalAmount);
      buyerName = order.buyer?.name || buyerName;
      buyerEmail = order.buyer?.email || buyerEmail;
      buyerPhone = order.buyer?.phoneNumber || buyerPhone;

      itemDetails = [
        ...order.items.map((item) => ({
          id: item.id.slice(0, 50),
          price: Number(item.price),
          quantity: Number(item.qty),
          name: (item.commodity || "Komoditas")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
            .slice(0, 45),
        })),
        ...(Number(order.shippingCost) > 0
          ? [{
              id: "SHIPPING",
              price: Number(order.shippingCost),
              quantity: 1,
              name: `Ongkos Kirim (${order.courier || 'Kurir'})`.slice(0, 45),
            }]
          : []),
        {
          id: "SERVICE_FEE",
          price: 2000,
          quantity: 1,
          name: "Biaya Layanan Aplikasi",
        },
      ];

      // Pastikan grossAmount SAMA PERSIS dengan total penjumlahan itemDetails (Midtrans Error 201/2603 fix)
      const calculatedSum = itemDetails.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);
      if (calculatedSum > 0) {
        grossAmount = calculatedSum;
      }

      // Jika sudah ada payment aktif yang masih pending DAN punya snapToken, kembalikan snap token
      const existingPayment = await prisma.payment.findUnique({
        where: { orderId },
      });

      if (existingPayment && existingPayment.status === "PENDING" && existingPayment.snapToken) {
        return NextResponse.json({
          snapUrl: existingPayment.snapUrl,
          snapToken: existingPayment.snapToken,
          midtransOrderId: existingPayment.midtransOrderId,
          grossAmount: Number(existingPayment.grossAmount),
        }, { headers: corsHeaders });
      }
    } else {
      // Jika order belum ada di Prisma DB (misal baru dibuat di client)
      grossAmount = Number(amount || 36000);
      itemDetails = items && items.length > 0 ? items.map((it: any) => ({
        id: (it.id || 'ITEM').slice(0, 50),
        price: Number(it.price || grossAmount),
        quantity: Number(it.quantity || 1),
        name: (it.name || `Pesanan ${orderId}`).slice(0, 45)
      })) : [{
        id: orderId.slice(0, 50),
        price: grossAmount,
        quantity: 1,
        name: `Pesanan ${orderId}`.slice(0, 45)
      }];

      const calculatedSum = itemDetails.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);
      if (calculatedSum > 0) {
        grossAmount = calculatedSum;
      }
    }

    // Generate unique Midtrans order ID
    const midtransOrderId = `${orderId}-${Date.now()}`;

    // Format phone & email agar valid di Midtrans Snap
    const cleanPhone = buyerPhone ? (
      buyerPhone.startsWith('+') ? buyerPhone :
      (buyerPhone.startsWith('62') ? '+' + buyerPhone :
      (buyerPhone.startsWith('0') ? '+62' + buyerPhone.slice(1) : '+62' + buyerPhone))
    ) : '+6281234567890';

    const cleanEmail = (buyerEmail && buyerEmail.includes('@')) ? buyerEmail : `buyer_${Date.now()}@tumbasna.id`;

    // Panggil Snap API Midtrans
    const MOBILE_URL = process.env.MIDTRANS_FINISH_URL || "https://app.tumbasna.my.id";
    const snapPayload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(grossAmount),
      },
      customer_details: {
        first_name: buyerName,
        email: cleanEmail,
        phone: cleanPhone,
      },
      item_details: itemDetails,
      credit_card: {
        secure: true,
      },
      callbacks: {
        finish: `${MOBILE_URL}/?app_order_id=${orderId}`,
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
        { status: 500, headers: corsHeaders }
      );
    }

    const snapToken = snapData.token;
    const snapUrl = snapData.redirect_url;

    // Simpan/update payment di DB jika order ada
    if (order) {
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
    }

    return NextResponse.json({
      snapToken,
      snapUrl,
      midtransOrderId,
      grossAmount,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[Payment Create Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500, headers: corsHeaders }
    );
  }
}
