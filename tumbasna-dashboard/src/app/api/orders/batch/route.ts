import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateShippingCost, getShippingZone } from '@/lib/shipping';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  supplierId: string;
  supplierName: string;
  supplierCity: string;
}

interface BatchOrderRequest {
  buyerUserId: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerCity: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  paymentMethod: string;
  cartItems: CartItem[];
}

export async function POST(req: Request) {
  try {
    const body: BatchOrderRequest = await req.json();
    const {
      buyerUserId,
      buyerAddress,
      buyerPhone,
      buyerCity,
      deliveryDate,
      deliveryTimeSlot,
      paymentMethod,
      cartItems,
    } = body;

    // Validate required fields
    if (!buyerUserId || !buyerAddress || !buyerCity || !deliveryDate || !deliveryTimeSlot || !cartItems?.length) {
      return NextResponse.json(
        { success: false, error: 'Data checkout tidak lengkap' },
        { status: 400 }
      );
    }

    // Group items by supplier
    const itemsBySupplier = cartItems.reduce((acc: Record<string, CartItem[]>, item) => {
      const key = item.supplierId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    const createdOrders = [];
    let totalShippingCost = 0;

    // Create separate order for each supplier
    for (const [supplierId, items] of Object.entries(itemsBySupplier)) {
      const firstItem = items[0];
      
      // Get supplier info from database
      const supplier = await prisma.user.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        console.warn(`Supplier not found: ${supplierId}`);
        continue;
      }

      const supplierCity = supplier.address?.split(',')[0]?.trim() || 'Banyumas';
      
      // Calculate shipping cost for this order
      const shippingCost = calculateShippingCost(
        supplierCity,
        buyerCity,
        paymentMethod
      );
      
      const shippingZone = getShippingZone(supplierCity, buyerCity);
      
      totalShippingCost += shippingCost;

      // Calculate order subtotal
      const subtotal = items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      const orderTotal = subtotal + shippingCost;

      // Generate unique order ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const orderId = `TRX-${timestamp}-${random}`.toUpperCase();

      // Create order
      const order = await prisma.order.create({
        data: {
          id: orderId,
          buyerUserId,
          supplierName: supplier.name || supplier.businessName || 'Supplier',
          supplierLocation: supplier.address || supplierCity,
          courier: 'Local Delivery',
          shippingCost,
          totalAmount: orderTotal,
          status: 'MENUNGGU_PEMBAYARAN',
          deliveryDate: new Date(deliveryDate),
          deliveryTimeSlot,
          buyerAddress,
          buyerPhone,
          buyerCity,
          supplierCity,
          shippingZone,
          items: {
            create: items.map(item => ({
              productEntryId: item.productId || null,
              commodity: item.name.toLowerCase(),
              price: item.price,
              qty: item.quantity,
              supplierName: supplier.name || supplier.businessName || 'Supplier',
            })),
          },
        },
        include: {
          items: true
        }
      });

      createdOrders.push(order);

      // Send WhatsApp notification to supplier (async, non-blocking)
      sendSupplierNotification(supplier, order, buyerUserId).catch(err => {
        console.warn(`Failed to send WA notification to ${supplier.phoneNumber}:`, err.message);
      });
    }

    // Calculate grand total
    const subtotalAll = createdOrders.reduce((sum, o) => 
      sum + (Number(o.totalAmount) - Number(o.shippingCost)), 0
    );
    
    const serviceFee = 2000; // Single service fee for entire transaction
    const grandTotal = subtotalAll + totalShippingCost + serviceFee;

    // Return summary
    return NextResponse.json({
      success: true,
      data: {
        orders: createdOrders.map(o => ({
          id: o.id,
          supplierName: o.supplierName,
          subtotal: Number(o.totalAmount) - Number(o.shippingCost),
          shippingCost: Number(o.shippingCost),
          total: Number(o.totalAmount),
          items: o.items
        })),
        summary: {
          subtotal: subtotalAll,
          shipping: totalShippingCost,
          serviceFee,
          total: grandTotal,
          orderIds: createdOrders.map(o => o.id),
          paymentMethod
        }
      }
    });

  } catch (error: any) {
    console.error('[BATCH ORDER ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function sendSupplierNotification(
  supplier: any,
  order: any,
  buyerUserId: string
) {
  const waUrl = process.env.WHATSAPP_BOT_URL || 'http://202.155.13.225:3002';
  const waApiKey = process.env.WHATSAPP_API_KEY || 'tumbasna-rahasia-banget';

  if (!supplier.phoneNumber) {
    console.warn(`⚠️ Supplier ${supplier.name} tidak punya nomor telepon`);
    return;
  }

  // Get buyer name
  let buyerName = 'Pedagang Tumbasna';
  try {
    const buyer = await prisma.user.findUnique({ 
      where: { id: buyerUserId },
      select: { name: true, businessName: true }
    });
    if (buyer) {
      buyerName = buyer.name || buyer.businessName || buyerName;
    }
  } catch (err) {
    console.warn('Failed to get buyer name:', err);
  }

  // Get order items
  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    select: { commodity: true, qty: true, price: true }
  });

  const itemsDesc = items.map(it =>
    `  • ${it.commodity.toUpperCase()} — ${it.qty} kg × Rp ${Number(it.price).toLocaleString('id-ID')}/kg`
  ).join('\n');

  // Format delivery time slot
  const timeSlotMap: Record<string, string> = {
    morning: 'Pagi (05.00-09.00)',
    midday: 'Siang (10.00-13.00)',
    afternoon: 'Sore (14.00-18.00)',
    evening: 'Malam (19.00-21.00)'
  };
  const deliveryTime = timeSlotMap[order.deliveryTimeSlot] || order.deliveryTimeSlot;

  const msg = `📢 *TUMBASNA: PESANAN BARU MASUK* 🌾\n\n` +
    `Halo Bpk/Ibu *${supplier.name}*,\n` +
    `Ada pesanan baru untuk komoditas Juragan!\n\n` +
    `• ID Pesanan: *${order.id}*\n` +
    `• Pembeli: *${buyerName}*\n` +
    `• Tanggal Kirim: *${new Date(order.deliveryDate).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}*\n` +
    `• Waktu Kirim: *${deliveryTime}*\n` +
    `• Rincian Barang:\n${itemsDesc}\n` +
    `• Total Nilai: *Rp ${Number(order.totalAmount).toLocaleString('id-ID')}*\n` +
    `• Status: *Menunggu Pembayaran*\n\n` +
    `Kami akan memberi tahu Juragan kembali begitu pembayaran dikonfirmasi oleh Escrow Tumbasna. ` +
    `Mohon jangan memproses barang sebelum ada notifikasi pembayaran lunas. 🤝`;

  console.log('📞 [WA] Attempting to send to:', supplier.phoneNumber);
  console.log('🌐 [WA] URL:', waUrl);

  const response = await fetch(`${waUrl}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': waApiKey
    },
    body: JSON.stringify({
      phone: supplier.phoneNumber,
      message: msg
    }),
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`WA API returned ${response.status}`);
  }

  const result = await response.json();
  console.log('✉️ [WA] Response:', result);

  if (!result.success) {
    throw new Error(`WA API Error: ${result.message || 'Unknown error'}`);
  }

  return result;
}
