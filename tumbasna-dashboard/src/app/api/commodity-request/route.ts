import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Admin lihat semua commodity requests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where = status ? { status: status as any } : {};

    const requests = await prisma.commodityRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('[API ERROR] GET /api/commodity-request:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Supplier submit commodity request (via WhatsApp bot)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      commodityName, 
      supplierPhone, 
      supplierName, 
      category, 
      reason,
      weightKg,
      pricePerKg,
      location
    } = body;

    if (!commodityName || !supplierPhone) {
      return NextResponse.json(
        { success: false, error: 'commodityName and supplierPhone are required' },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada request untuk komoditas yang sama dari supplier yang sama dengan status PENDING
    const existingRequest = await prisma.commodityRequest.findFirst({
      where: {
        commodityName: {
          equals: commodityName,
          mode: 'insensitive'
        },
        supplierPhone,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: 'Request already exists',
        data: existingRequest
      });
    }

    const newRequest = await prisma.commodityRequest.create({
      data: {
        commodityName,
        supplierPhone,
        supplierName,
        category,
        reason,
        weightKg,
        pricePerKg,
        location,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error('[API ERROR] POST /api/commodity-request:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Admin approve/reject commodity request
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, reviewedBy, reviewNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const updated = await prisma.commodityRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes
      }
    });

    // Jika APPROVED, tambahkan ke whitelist di config.json
    if (status === 'APPROVED') {
      const fs = await import('fs');
      const path = await import('path');
      const configPath = path.join(process.cwd(), 'config.json');

      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (!config.supplier.whitelistCommodities.includes(updated.commodityName)) {
          config.supplier.whitelistCommodities.push(updated.commodityName);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
          console.log(`✅ Komoditas "${updated.commodityName}" ditambahkan ke whitelist`);
        }
      } catch (configError: any) {
        console.error('Error updating config.json:', configError.message);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[API ERROR] PATCH /api/commodity-request:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
