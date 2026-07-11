import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/dashboard/saldo — Ambil daftar saldo supplier untuk pencairan manual
export async function GET() {
  try {
    const suppliers = await prisma.user.findMany({
      where: {
        role: "PETANI",
        balance: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        phoneNumber: true,
        address: true,
        bankName: true,
        bankAccount: true,
        balance: true,
        createdAt: true,
      },
      orderBy: { balance: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: suppliers.map((s) => ({
        id: s.id,
        name: s.name || "-",
        businessName: s.businessName || "-",
        phone: s.phoneNumber,
        address: s.address || "-",
        bankName: s.bankName || "-",
        bankAccount: s.bankAccount || "-",
        balance: Number(s.balance),
      })),
    });
  } catch (error: any) {
    console.error("[SALDO GET ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/dashboard/saldo — Tandai saldo supplier sudah dicairkan (reset ke 0)
export async function POST(req: Request) {
  try {
    const { supplierId, amount, note } = await req.json();

    if (!supplierId) {
      return NextResponse.json({ error: "Missing supplierId" }, { status: 400 });
    }

    const supplier = await prisma.user.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier tidak ditemukan" }, { status: 404 });
    }

    const disbursedAmount = amount ?? Number(supplier.balance);

    // Reset saldo ke 0 (atau kurangi sesuai amount jika sebagian)
    await prisma.user.update({
      where: { id: supplierId },
      data: { balance: { decrement: disbursedAmount } },
    });

    // Kirim notif WA ke supplier bahwa dana sudah ditransfer
    try {
      const waUrl = process.env.WHATSAPP_BOT_URL || "http://127.0.0.1:3002";
      const waApiKey = process.env.WHATSAPP_API_KEY || process.env.TUMBASNA_SECRET_KEY || "tumbasna-rahasia-banget";
      const msg =
        `💰 *TUMBASNA: DANA BERHASIL DICAIRKAN* 🎉\n\n` +
        `Halo Bpk/Ibu *${supplier.name}*,\n\n` +
        `Kabar baik! Dana hasil penjualan komoditas Juragan sebesar *Rp ${disbursedAmount.toLocaleString("id-ID")}* ` +
        `telah kami transfer ke rekening bank Juragan:\n\n` +
        `• Bank: *${supplier.bankName || "-"}*\n` +
        `• No. Rekening: *${supplier.bankAccount || "-"}*\n` +
        `${note ? `• Catatan: _${note}_\n` : ""}` +
        `\nMohon dicek di aplikasi perbankan Juragan dalam 1×24 jam kerja. ` +
        `Terima kasih telah bermitra bersama Tumbasna! 🌾`;

      await fetch(`${waUrl}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-secret-key": waApiKey },
        body: JSON.stringify({ phone: supplier.phoneNumber, message: msg }),
      });
    } catch (notifErr: any) {
      console.warn("[SALDO NOTIF] Gagal kirim notif WA:", notifErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Dana Rp ${disbursedAmount.toLocaleString("id-ID")} untuk ${supplier.name} berhasil ditandai cair.`,
    });
  } catch (error: any) {
    console.error("[SALDO POST ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
