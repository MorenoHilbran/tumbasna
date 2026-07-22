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

    const where: any = {};
    if (supplierName) {
      where.supplierName = supplierName;
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const review = await prisma.review.upsert({
      where: { orderId },
      update: {
        rating: Number(rating),
        comment: comment || "",
        supplierName: supplierName || order.supplierName,
        buyerUserId: buyerUserId || order.buyerUserId,
      },
      create: {
        orderId,
        rating: Number(rating),
        comment: comment || "",
        supplierName: supplierName || order.supplierName,
        buyerUserId: buyerUserId || order.buyerUserId,
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
