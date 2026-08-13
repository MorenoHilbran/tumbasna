import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/reviews?orderId=xxx OR ?supplierName=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const supplierName = searchParams.get("supplierName");

    if (orderId) {
      const review = await prisma.review.findUnique({
        where: { orderId },
      });
      return NextResponse.json({ success: true, data: review }, { headers: corsHeaders });
    }

    // Ambil seluruh nama supplier/user aktif di tabel User
    const activeUsers = await prisma.user.findMany({
      select: { name: true, businessName: true },
    });

    const validSupplierNames = activeUsers
      .flatMap((u) => [u.name, u.businessName])
      .filter((n): n is string => Boolean(n && n.trim() !== ""));

    const where: any = {};
    if (supplierName) {
      where.supplierName = supplierName;
    } else {
      where.supplierName = { in: validSupplierNames };
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            buyer: {
              select: {
                name: true,
                phoneNumber: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: reviews }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[API Reviews GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reviews" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/reviews
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, rating, comment, buyerUserId, supplierName } = body;

    if (!orderId || !rating) {
      return NextResponse.json(
        { success: false, error: "orderId and rating are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate UUID format for buyerUserId to prevent PostgreSQL syntax error
    const isValidUuid = (str?: string | null) => 
      str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str) : false;

    let order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    // If order does not exist in DB (e.g. demo order or local test order), create fallback Order
    if (!order) {
      try {
        order = await prisma.order.create({
          data: {
            id: orderId,
            supplierName: supplierName || 'Supplier Komoditas',
            supplierLocation: 'Banyumas Raya',
            courier: 'Kurir Lokal',
            status: 'SELESAI' as any,
            totalAmount: 0,
          }
        });
      } catch (createOrderErr) {
        console.warn('[API Reviews] Fallback order creation warning:', createOrderErr);
      }
    }

    const finalSupplierName = supplierName || order?.supplierName || 'Supplier Komoditas';
    const finalBuyerUserId = isValidUuid(buyerUserId) 
      ? buyerUserId 
      : (isValidUuid(order?.buyerUserId) ? order?.buyerUserId : null);

    const review = await prisma.review.upsert({
      where: { orderId },
      update: {
        rating: Number(rating),
        comment: comment || "",
        supplierName: finalSupplierName,
        buyerUserId: finalBuyerUserId,
      },
      create: {
        orderId,
        rating: Number(rating),
        comment: comment || "",
        supplierName: finalSupplierName,
        buyerUserId: finalBuyerUserId,
      },
    });

    return NextResponse.json({ success: true, data: review }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[API Reviews POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit review" },
      { status: 500, headers: corsHeaders }
    );
  }
}
