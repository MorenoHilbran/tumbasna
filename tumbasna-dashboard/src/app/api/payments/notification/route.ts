import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// @ts-ignore
import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();
    console.log("Midtrans Notification received:", notificationJson);

    // Verifikasi notifikasi dengan SDK
    const statusResponse = await snap.transaction.notification(notificationJson);
    
    const midtransOrderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let paymentStatus: any = "PENDING";

    if (transactionStatus == 'capture') {
        if (fraudStatus == 'challenge') {
            paymentStatus = 'PENDING';
        } else if (fraudStatus == 'accept') {
            paymentStatus = 'CAPTURE';
        }
    } else if (transactionStatus == 'settlement') {
        paymentStatus = 'SETTLEMENT';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
        paymentStatus = transactionStatus.toUpperCase();
    } else if (transactionStatus == 'pending') {
        paymentStatus = 'PENDING';
    }

    // Cari payment di DB berdasarkan midtransOrderId
    const payment = await prisma.payment.findUnique({
        where: { midtransOrderId: midtransOrderId },
        include: { order: true }
    });

    if (!payment) {
        console.error("Payment not found for order:", midtransOrderId);
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update status payment
    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: paymentStatus,
            paymentType: statusResponse.payment_type,
            transactionId: statusResponse.transaction_id,
            rawResponse: statusResponse as any,
            ...(paymentStatus === 'SETTLEMENT' || paymentStatus === 'CAPTURE' ? { paidAt: new Date() } : {})
        }
    });

    // Update status Order jika settlement
    if (paymentStatus === 'SETTLEMENT') {
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "DIPROSES" } // Otomatis pindah ke diproses
        });
        
        // Cari supplier berdasarkan nama dari order
        const supplierUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { businessName: payment.order.supplierName },
                    { name: payment.order.supplierName }
                ]
            }
        });
        const supplierPhone = supplierUser?.phoneNumber || "6281234567890";

        // Kirim notifikasi WhatsApp ke supplier bahwa order sudah dibayar
        try {
            await fetch('http://localhost:3002/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: supplierPhone,
                    message: `✅ *Pesanan Baru Terbayar (Midtrans)*\n\nID: ${payment.orderId}\nStatus: Lunas (Escrow)\n\nPembeli telah membayar pesanan. Harap segera memproses dan mengirimkan komoditas sesuai permintaan.`
                })
            });
            console.log(`WA Notif terkirim ke supplier (${supplierPhone})`);
        } catch (e) {
            console.error("Gagal mengirim WA notif", e);
        }
    } else if (paymentStatus === 'CANCEL' || paymentStatus === 'EXPIRE' || paymentStatus === 'DENY') {
        await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "DIBATALKAN" }
        });
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error: any) {
    console.error("[Midtrans Notification Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
