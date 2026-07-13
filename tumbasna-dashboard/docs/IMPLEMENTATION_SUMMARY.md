# ?? IMPLEMENTASI CHECKOUT FLOW BARU - TUMBASNA
## Status: ? READY TO DEPLOY
## Tanggal: 13 Juli 2026

---

## ?? YANG SUDAH DIBUAT

### 1. ? Cart Pill Bar Component
**File:** `src/components/CartPillBar.tsx`

**Features:**
- Sticky bottom bar yang muncul saat ada produk di keranjang
- Menampilkan thumbnail produk (max 3)
- Total items & harga
- Expand untuk melihat detail keranjang
- Update quantity langsung dari pill bar
- Animasi smooth slide-in/fade-in
- Responsive mobile & desktop

**Usage:**
```tsx
// Di layout.tsx atau page yang perlu cart
import CartPillBar from '@/components/CartPillBar';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <CartPillBar />
    </>
  );
}
```

---

### 2. ? Shipping Calculator Library
**File:** `src/lib/shipping.ts`

**Features:**
- Zone-based pricing (Rp 2.500 / Rp 5.000 / Rp 10.000)
- City normalization (handle typos & variations)
- COD = FREE shipping
- Support 15+ kota di Barlingmascakeb
- Delivery time estimation
- Multi-order shipping calculation

**Functions:**
```typescript
// Calculate shipping cost
calculateShippingCost('Purwokerto', 'Cilacap', 'QRIS') // Returns: 5000

// Normalize city name
normalizeCity('pwt') // Returns: 'Purwokerto'

// Get zone
getShippingZone('Banyumas', 'Tegal') // Returns: 'far_city'

// Format for display
formatShippingCost(2500) // Returns: 'Rp 2.500'
```

---

### 3. ? Batch Order API (Multi-Supplier)
**File:** `src/app/api/orders/batch/route.ts`

**Features:**
- Auto-split cart by supplier
- Single service fee (Rp 2.000) untuk semua orders
- Calculate shipping per supplier
- WhatsApp notification to each supplier
- Error handling & fallback
- 10 second timeout untuk WA API

**Request:**
```json
POST /api/orders/batch
{
  "buyerUserId": "uuid",
  "buyerAddress": "Jl. Sudirman No. 123",
  "buyerPhone": "628123456789",
  "buyerCity": "Purwokerto",
  "deliveryDate": "2026-07-15",
  "deliveryTimeSlot": "morning",
  "paymentMethod": "QRIS",
  "cartItems": [
    {
      "id": "cart-1",
      "productId": "prod-1",
      "name": "Beras Premium",
      "price": 12000,
      "quantity": 10,
      "supplierId": "supplier-1",
      "supplierName": "Pak Budi",
      "supplierCity": "Banyumas"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "TRX-1720875456789-ABC123",
        "supplierName": "Pak Budi",
        "subtotal": 120000,
        "shippingCost": 2500,
        "total": 122500,
        "items": [...]
      }
    ],
    "summary": {
      "subtotal": 120000,
      "shipping": 2500,
      "serviceFee": 2000,
      "total": 124500,
      "orderIds": ["TRX-1720875456789-ABC123"],
      "paymentMethod": "QRIS"
    }
  }
}
```

---

### 4. ? Database Migration
**File:** `prisma/migrations/add_delivery_scheduling.sql`

**Changes:**
- Added columns to `orders` table:
  - `delivery_date` (DATE)
  - `delivery_time_slot` (VARCHAR)
  - `buyer_address` (TEXT)
  - `buyer_phone` (VARCHAR)
  - `buyer_city` (VARCHAR)
  - `supplier_city` (VARCHAR)
  - `shipping_zone` (VARCHAR)
  - `payment_group_id` (UUID)

- Created `payment_groups` table
  - For multi-supplier checkout
  - Single payment for multiple orders

- Created `supplier_delivery_settings` table
  - Time slots: morning, midday, afternoon, evening
  - Daily capacity per slot
  - Enable/disable slots

- Created `supplier_blocked_dates` table
  - Supplier holiday calendar
  - Prevent orders on blocked dates

- Created `notification_queue` table
  - Store failed WA notifications
  - Retry mechanism

**Run Migration:**
```bash
cd tumbasna-dashboard

# Copy SQL to psql or run via Supabase dashboard
# Atau generate dengan Prisma:
npx prisma db push
```

---

## ?? CHECKOUT FLOW YANG BARU

### Step 1: Cart (Pill Bar)
```
User add produk ? Pill bar muncul
Click pill bar ? Expand detail keranjang
Update quantity / remove item
Click "Lanjut ke Checkout"
```

### Step 2: Checkout Page
```
+-------------------------------------+
¦ ?? PILIH TANGGAL PENGIRIMAN        ¦
¦ ? Hari Ini                          ¦
¦ ? Besok                             ¦
¦ ? Lusa                              ¦
+-------------------------------------+

+-------------------------------------+
¦ ?? DETAIL PESANAN                   ¦
¦ [List produk di keranjang]         ¦
+-------------------------------------+

+-------------------------------------+
¦ ?? PRODUK LAINNYA                   ¦
¦ [Horizontal scroll rekomendasi]    ¦
+-------------------------------------+

+-------------------------------------+
¦ ?? ALAMAT PENGIRIMAN                ¦
¦ [Form alamat lengkap + kota]       ¦
+-------------------------------------+

+-------------------------------------+
¦ ? WAKTU PENGIRIMAN                 ¦
¦ ? Pagi (05.00 - 09.00)            ¦
¦ ? Siang (10.00 - 13.00)           ¦
¦ ? Sore (14.00 - 18.00)            ¦
¦ ? Malam (19.00 - 21.00)           ¦
+-------------------------------------+

+-------------------------------------+
¦ ?? METODE PEMBAYARAN                ¦
¦ ? QRIS (Direkomendasikan) ??       ¦
¦ [Expand untuk metode lain]         ¦
+-------------------------------------+

+-------------------------------------+
¦ ?? RINGKASAN PEMBAYARAN             ¦
¦ Subtotal         Rp 120.000        ¦
¦ Ongkir           Rp   2.500        ¦
¦ Biaya Layanan    Rp   2.000        ¦
¦ ---------------------------------  ¦
¦ TOTAL            Rp 124.500        ¦
+-------------------------------------+

[Button: Lanjutkan Pembayaran]
```

### Step 3: Payment Page
```
+-------------------------------------+
¦ ?? COUNTDOWN: 14:52 / 15:00        ¦
¦ [QR Code QRIS]                     ¦
¦ Scan dengan e-wallet/m-banking     ¦
+-------------------------------------+

[Instruksi pembayaran]
[Ringkasan pesanan]
[Alamat pengiriman]
[Rincian pembayaran]
```

---

## ?? TODO: YANG MASIH PERLU DIBUAT

### Frontend (Mobile/Dashboard)

1. **Checkout Page** (`src/app/checkout/page.tsx`)
   - Form alamat pengiriman
   - Date picker untuk delivery date
   - Time slot selector
   - Payment method selector
   - Ringkasan pembayaran
   - Integration dengan `/api/orders/batch`

2. **Payment Page** (`src/app/payment/[orderId]/page.tsx`)
   - Display QR Code QRIS
   - Countdown timer (15 menit)
   - Auto-refresh status payment
   - Instruksi pembayaran per metode
   - Ringkasan order

3. **Supplier Dashboard - Delivery Settings**
   - Enable/disable time slots
   - Set daily capacity
   - Block dates calendar
   - View upcoming deliveries

### Backend APIs

4. **Payment Group API** (`src/app/api/payments/group/route.ts`)
   - Create payment for multiple orders
   - Generate single QRIS for all orders
   - Handle webhook for grouped payment

5. **Delivery Settings API** (`src/app/api/supplier/delivery-settings/route.ts`)
   - GET: Fetch supplier settings
   - POST: Update settings
   - GET available slots for date

6. **Blocked Dates API** (`src/app/api/supplier/blocked-dates/route.ts`)
   - GET: List blocked dates
   - POST: Add blocked date
   - DELETE: Remove blocked date

---

## ?? CONFIGURATION

### Environment Variables (.env)
```env
# WhatsApp Bot (UPDATE DENGAN URL YANG BENAR!)
WHATSAPP_BOT_URL="http://202.155.13.225:3002"
WHATSAPP_API_KEY="tumbasna-rahasia-banget"

# Midtrans
MIDTRANS_SERVER_KEY="your-midtrans-server-key"
MIDTRANS_CLIENT_KEY="your-midtrans-client-key"
MIDTRANS_IS_PRODUCTION="false"

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

---

## ?? CRITICAL: WhatsApp Bot Issue

### Status: ? NOT CONNECTED

**Problem:**
- Bot tidak bisa diakses di `http://202.155.13.225:3002`
- Semua URL test gagal connect

**Needed Information:**
1. URL production Tumbasna? (domain/subdomain)
2. Output: `ssh moreno@202.155.13.225 'pm2 list'`
3. Nginx config untuk WA bot
4. Test dari VPS: `curl http://localhost:3002/health`

**Temporary Solution:**
- WA notification akan tetap dicoba
- Jika gagal, akan di-log (tidak block order creation)
- Notification tersimpan di `notification_queue` table

---

## ? TESTING CHECKLIST

### Test 1: Cart Pill Bar
- [ ] Add produk ke cart
- [ ] Verify pill bar muncul
- [ ] Click pill bar ? expand
- [ ] Update quantity
- [ ] Remove item
- [ ] Click "Lanjut ke Checkout"

### Test 2: Shipping Calculator
```typescript
import { calculateShippingCost } from '@/lib/shipping';

// Same city
console.log(calculateShippingCost('Purwokerto', 'Purwokerto', 'QRIS')); // 2500

// Near city
console.log(calculateShippingCost('Banyumas', 'Cilacap', 'QRIS')); // 5000

// Far city  
console.log(calculateShippingCost('Banyumas', 'Tegal', 'QRIS')); // 10000

// COD = Free
console.log(calculateShippingCost('Banyumas', 'Tegal', 'COD')); // 0
```

### Test 3: Batch Order API
```bash
curl -X POST http://localhost:3000/api/orders/batch \
  -H "Content-Type: application/json" \
  -d '{
    "buyerUserId": "uuid",
    "buyerAddress": "Jl. Sudirman 123",
    "buyerPhone": "628123456789",
    "buyerCity": "Purwokerto",
    "deliveryDate": "2026-07-15",
    "deliveryTimeSlot": "morning",
    "paymentMethod": "QRIS",
    "cartItems": [...]
  }'
```

### Test 4: Database Migration
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('delivery_date', 'buyer_city', 'shipping_zone');

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('payment_groups', 'supplier_delivery_settings');
```

---

## ?? DEPLOYMENT STEPS

### 1. Backup Database
```bash
# Via Supabase dashboard: Settings ? Database ? Backup
```

### 2. Run Migration
```bash
# Option A: Via Supabase SQL Editor
# Copy-paste content dari add_delivery_scheduling.sql

# Option B: Via Prisma (after updating schema.prisma)
cd tumbasna-dashboard
npx prisma db push
```

### 3. Deploy Code
```bash
# Push to VPS
ssh moreno@202.155.13.225
cd /opt/tumbasna/tumbasna-dashboard

# Pull latest
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart
pm2 restart tumbasna-dashboard
```

### 4. Verify Deployment
```bash
# Check logs
pm2 logs tumbasna-dashboard

# Test API
curl http://localhost:3000/api/orders/batch
```

---

## ?? PERFORMANCE CONSIDERATIONS

### Database Indexes
? Already added in migration:
- `idx_orders_delivery_date` - Fast delivery date queries
- `idx_orders_buyer_city` - Fast city filtering
- `idx_payment_groups_status` - Fast payment status lookup

### API Response Time
- Target: < 500ms for batch order creation
- WhatsApp notification: Async, non-blocking (10s timeout)
- Use connection pooling (already configured in Supabase)

### Caching Strategy
```typescript
// Future improvement: Cache shipping costs
const SHIPPING_CACHE_TTL = 60 * 60; // 1 hour

// Cache supplier delivery settings
const DELIVERY_SETTINGS_CACHE_TTL = 60 * 5; // 5 minutes
```

---

## ?? KNOWN ISSUES & WORKAROUNDS

### Issue 1: WhatsApp Bot Not Accessible
**Status:** ?? CRITICAL
**Impact:** Supplier tidak dapat notifikasi
**Workaround:** Notifications saved to `notification_queue`
**Fix:** Need VPS access & correct URL

### Issue 2: Multi-Supplier Payment
**Status:** ?? TO IMPLEMENT
**Impact:** Belum ada UI untuk grouped payment
**Next:** Create payment group API & UI

---

## ?? SUPPORT & NEXT STEPS

**Tunggu informasi dari Anda:**
1. ? URL/domain production Tumbasna
2. ? VPS access untuk debug WA bot
3. ? Approval untuk run database migration

**Setelah itu saya akan:**
1. ? Fix WA bot connection
2. ? Build checkout page UI
3. ? Build payment page UI
4. ? Build supplier delivery settings dashboard
5. ? End-to-end testing

---

**Ready to continue!** ??

