import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/matching/search?commodity=Cabai&type=SUPPLY&qty=100&maxPrice=5000&location=Banyumas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const commodity = searchParams.get("commodity");
    const type = searchParams.get("type") || "SUPPLY"; // SUPPLY = cari pasokan, DEMAND = cari pembeli
    const qtyParam = searchParams.get("qty");
    const maxPriceParam = searchParams.get("maxPrice");
    const locationParam = searchParams.get("location");

    if (!commodity) {
      return NextResponse.json(
        { success: false, error: "commodity parameter is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build where clause
    const where: any = {
      type: type as any,
      status: "ACTIVE",
      commodity: {
        contains: commodity,
        mode: "insensitive",
      },
    };

    if (locationParam) {
      where.location = {
        contains: locationParam,
        mode: "insensitive",
      };
    }

    if (maxPriceParam) {
      where.price = {
        lte: parseFloat(maxPriceParam),
      };
    }

    if (qtyParam) {
      where.qty = {
        gte: parseFloat(qtyParam),
      };
    }

    const entries = await prisma.productEntry.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            businessName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const results = entries.map((entry) => ({
      id: entry.id,
      supplierName: entry.user.businessName || entry.user.name || "Supplier",
      commodity: entry.commodity,
      qty: Number(entry.qty),
      price: Number(entry.price),
      location: entry.location,
      type: entry.type,
      supplierPhone: entry.user.phoneNumber,
      lat: entry.lat,
      lng: entry.lng,
      score: 0.85, // Placeholder score
    }));

    return NextResponse.json(
      { success: true, data: results },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[API Matching Search Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search matches" },
      { status: 500, headers: corsHeaders }
    );
  }
}
