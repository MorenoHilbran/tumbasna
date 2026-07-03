# 💳 Rencana Integrasi Midtrans Payment Gateway

> **Tanggal:** 2 Juli 2026  
> **Status:** ❌ Belum Diimplementasi  
> **Prioritas:** 🔴 Tinggi  
> **Estimasi:** 7 hari kerja

---

## Status Saat Ini

- **QRIS di mobile app:** Simulasi saja (QR dummy dari `api.qrserver.com`)
- **Escrow:** Field `fundsReleased` ada di DB tapi tidak ada logika transfer dana
- **Midtrans code:** Zero references dalam seluruh codebase
- **Balance user:** Field `balance` ada di User model tapi tidak digunakan

---

## Rencana Implementasi

### 1. Persiapan Akun

1. Daftar di [dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Lengkapi dokumen bisnis (KTP, NPWP, SIUP)
3. Dapatkan credentials:
   - **Server Key** (untuk backend)
   - **Client Key** (untuk frontend)
   - **Merchant ID**
4. Gunakan **Sandbox** untuk testing

### 2. Install Dependency

```bash
cd tumbasna-dashboard
npm install midtrans-client
```

### 3. Tambah Environment Variables

```env
# tumbasna-dashboard/.env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=G000000000
MIDTRANS_WEBHOOK_URL=https://domain.com/api/payments/notification
```

### 4. Tambah Model Database

```prisma
// Tambahkan di prisma/schema.prisma

model Payment {
  id              String         @id @default(uuid()) @db.Uuid
  orderId         String         @unique @map("order_id")
  midtransOrderId String         @unique @map("midtrans_order_id")
  transactionId   String?        @map("transaction_id")
  paymentType     String?        @map("payment_type")
  grossAmount     Decimal        @db.Decimal(12, 2)
  status          payment_status @default(PENDING)
  snapToken       String?        @map("snap_token")
  snapUrl         String?        @map("snap_url")
  vaNumber        String?        @map("va_number")
  qrCodeUrl       String?        @map("qr_code_url")
  paidAt          DateTime?      @map("paid_at") @db.Timestamptz(6)
  expiredAt       DateTime?      @map("expired_at") @db.Timestamptz(6)
  rawResponse     Json?          @map("raw_response")
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("payments")
}

enum payment_status {
  PENDING
  CAPTURE
  SETTLEMENT
  DENY
  CANCEL
  EXPIRE
  REFUND
}

// Update Order model - tambah relasi:
// payment Payment?
```

### 5. Buat API Routes

#### `POST /api/payments/create`
```typescript
// src/app/api/payments/create/route.ts
// Flow:
// 1. Terima orderId dari request
// 2. Ambil Order + items dari DB
// 3. Buat Snap transaction via Midtrans SDK
// 4. Simpan Payment record dengan snapToken & snapUrl
// 5. Return snapToken ke mobile app
```

#### `POST /api/payments/notification`
```typescript
// src/app/api/payments/notification/route.ts
// Flow:
// 1. Terima notification dari Midtrans
// 2. Verifikasi signature key
// 3. Update Payment status
// 4. Jika SETTLEMENT:
//    a. Update Order status → DIPROSES
//    b. Kirim notifikasi WA ke buyer
//    c. Kirim notifikasi WA ke supplier
// 5. Jika EXPIRE/CANCEL:
//    a. Update Order status → DIBATALKAN
//    b. Kirim notifikasi WA ke buyer
```

#### `GET /api/payments/status/[orderId]`
```typescript
// src/app/api/payments/status/[orderId]/route.ts
// Flow:
// 1. Ambil Payment by orderId
// 2. Opsional: cek status terbaru ke Midtrans API
// 3. Return payment status
```

### 6. Update Mobile App

#### PembayaranQris.tsx
```
Current: Tampilkan QR dummy + countdown timer simulasi
Target:  Redirect ke Midtrans Snap page / embed Snap.js
```

#### Checkout.tsx
```
Current: Langsung buat order + tampilkan QR dummy
Target:  Buat order → call /api/payments/create → redirect Snap
```

#### DetailPesanan.tsx
```
Current: Status update manual/mock
Target:  Poll /api/payments/status untuk real-time status
```

### 7. Metode Pembayaran Yang Didukung

| Metode | Kode Midtrans | Prioritas |
|--------|--------------|-----------|
| QRIS | `qris` | 🔴 Tinggi |
| Bank Transfer (BCA VA) | `bank_transfer` | 🔴 Tinggi |
| Bank Transfer (BNI VA) | `bank_transfer` | 🔴 Tinggi |
| Bank Transfer (Mandiri VA) | `echannel` | 🟡 Sedang |
| GoPay | `gopay` | 🟡 Sedang |
| ShopeePay | `shopeepay` | 🟡 Sedang |

### 8. Flow Lengkap

```
Buyer (Mobile App)
│
├── 1. Add to Cart → Checkout
│   └── POST /api/orders (create order)
│
├── 2. Pilih Pembayaran
│   └── POST /api/payments/create
│       └── Midtrans Snap API → return snap_token
│
├── 3. Bayar
│   └── Open Snap payment page (redirect/popup)
│       └── Buyer pilih metode & bayar
│
├── 4. Callback (otomatis dari Midtrans)
│   └── POST /api/payments/notification
│       ├── Verifikasi signature
│       ├── Update Payment.status = SETTLEMENT
│       ├── Update Order.status = DIPROSES
│       ├── Kirim WA notif ke Buyer ✅
│       └── Kirim WA notif ke Supplier ✅
│
├── 5. Supplier proses & kirim barang
│   └── PATCH /api/orders/[id] { status: "DIKIRIM" }
│
├── 6. Buyer konfirmasi terima
│   └── PATCH /api/orders/[id] { status: "SELESAI" }
│       ├── Release escrow funds
│       ├── Update User.balance (supplier)
│       └── Update Order.fundsReleased = true
│
└── 7. Selesai ✅
```

### 9. Escrow Logic

```typescript
// Saat pembayaran berhasil (SETTLEMENT):
// → Dana ditahan di akun Midtrans (hold)
// → Order status: DIPROSES

// Saat buyer konfirmasi terima:
// → Release dana ke supplier
// → Update Order.fundsReleased = true
// → Update supplier User.balance += totalAmount - fee
// → Kirim notifikasi WA ke supplier

// Saat buyer tidak konfirmasi dalam 3 hari:
// → Auto-release dana (cron job)
```

### 10. Testing Checklist

- [ ] Create payment dengan Snap token berhasil
- [ ] Snap page tampil dan bisa digunakan
- [ ] Notification webhook diterima & diproses
- [ ] Status SETTLEMENT → Order DIPROSES
- [ ] Status EXPIRE → Order DIBATALKAN
- [ ] Notifikasi WA terkirim setelah pembayaran
- [ ] Escrow release setelah konfirmasi buyer
- [ ] Sandbox card testing: `4811 1111 1111 1114`
- [ ] Sandbox QRIS testing
- [ ] Error handling: duplicate notification, invalid signature

---

## Timeline

| Minggu | Sprint | Deliverable |
|--------|--------|-------------|
| 1 | Setup | Akun Midtrans + credentials + model Payment + migrasi |
| 1-2 | Backend | API create payment + webhook notification |
| 2 | Frontend | Update mobile app (Snap redirect) |
| 2-3 | Escrow | Logic escrow + release dana |
| 3 | Testing | E2E testing sandbox + fix bugs |
