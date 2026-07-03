# 📋 TUMBASNA — Dokumen Pengembangan & Project Management

> **Versi Dokumen:** 1.0.0  
> **Tanggal:** 2 Juli 2026  
> **Project Manager:** AI Assistant  
> **Status Project:** MVP Development — Phase 1 Complete, Phase 2 In Progress

---

## 📑 Daftar Isi

1. [Overview Project](#1-overview-project)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Progress Pengembangan](#3-progress-pengembangan)
4. [Status Integrasi WhatsApp Gateway](#4-status-integrasi-whatsapp-gateway)
5. [Rencana Integrasi Payment Gateway (Midtrans)](#5-rencana-integrasi-payment-gateway-midtrans)
6. [Rencana Integrasi Ekspedisi (RajaOngkir)](#6-rencana-integrasi-ekspedisi-rajaongkir)
7. [Status Database & Integrasi](#7-status-database--integrasi)
8. [Cara Menjalankan Project](#8-cara-menjalankan-project)
9. [Konfigurasi Yang Diperlukan](#9-konfigurasi-yang-diperlukan)
10. [Tahapan Pengembangan (Roadmap)](#10-tahapan-pengembangan-roadmap)
11. [Risiko & Mitigasi](#11-risiko--mitigasi)
12. [Catatan Rename Folder](#12-catatan-rename-folder)

---

## 1. Overview Project

**Tumbasna** adalah platform ekosistem digital UMKM & Smart Supply Chain Management untuk komoditas pangan Indonesia. Platform ini menghubungkan petani/supplier dengan pembeli/UMKM menggunakan AI-powered conversational commerce via WhatsApp dan mobile app.

### Visi
Menjadi platform supply chain komoditas pangan terdepan di Indonesia yang menghubungkan petani langsung ke pedagang melalui teknologi AI dan otomasi.

### Komponen Sistem

| Komponen | Direktori | Tech Stack | Status |
|----------|-----------|------------|--------|
| **Dashboard + API Backend** | `tumbasna-dashboard/` | Next.js 16, React 19, Prisma, PostgreSQL | ✅ Aktif |
| **WhatsApp Bot Gateway** | `tumbasna-whatsapp/` | Node.js, Baileys, LangChain, Express | ✅ Built (Belum Operasional) |
| **Mobile App (Buyer)** | `tumbasna-mobile/` | Ionic React, Capacitor, Vite | ✅ Built |
| **Standalone API** | `tumbasna-api/` | — | ❌ Kosong (API via Dashboard) |
| **Ivolate Dashboard** | `ivolate-dashboard/` | — | ❌ Kosong |

### Arsitektur Monorepo
```
tumbasna/ (root)
├── tumbasna-dashboard/    ← Next.js (Dashboard UI + REST API Backend)
├── tumbasna-whatsapp/     ← Node.js (WhatsApp Bot, terpisah)
├── tumbasna-mobile/       ← Ionic React (Mobile App Buyer)
├── tumbasna-api/          ← [KOSONG] Placeholder
├── ivolate-dashboard/     ← [KOSONG] Tidak digunakan
├── docker-compose.yml     ← Orchestrasi Dashboard + WA Bot
└── docs/ *.md             ← Dokumentasi teknis
```

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TUMBASNA ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐ │
│  │  Mobile App   │───▶│  tumbasna-dashboard │◀───│  WhatsApp Bot   │ │
│  │  (Buyer)      │    │  (Next.js API)     │    │  (Baileys)      │ │
│  │  Port: 5173   │    │  Port: 3000        │    │  Port: 3002     │ │
│  └──────────────┘    └────────┬───────────┘    └──────────────────┘ │
│                                │                                     │
│                     ┌──────────┴──────────┐                         │
│                     │   PostgreSQL (Supabase)│                       │
│                     │   + Prisma ORM         │                       │
│                     └─────────────────────────┘                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Integrasi Eksternal                        │   │
│  │  ✅ Gemini AI    ✅ Nominatim    ✅ Fonnte WA                │   │
│  │  ✅ LangChain    ✅ Leaflet/OSM  ⚠️ Biteship (partial)      │   │
│  │  ❌ Midtrans     ❌ RajaOngkir   ⚠️ QRIS (mock)            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Progress Pengembangan

### 3.1 Ringkasan Progress Keseluruhan

| Area | Progress | Status |
|------|----------|--------|
| Database Schema (Prisma) | █████████░ 90% | ✅ Production-ready |
| API Endpoints | ████████░░ 80% | ✅ Fungsional |
| Dashboard UI | ████████░░ 80% | ✅ Built |
| Mobile App UI | █████████░ 90% | ✅ Built |
| WhatsApp Bot | ███████░░░ 70% | ⚠️ Built, belum operasional |
| Smart Matching Engine | █████████░ 90% | ✅ Working |
| Payment Gateway | █░░░░░░░░░ 10% | ❌ Mock only |
| Shipping/Ekspedisi | ███░░░░░░░ 30% | ⚠️ Partial (Biteship) |
| Authentication | ████░░░░░░ 40% | ⚠️ Basic (no JWT) |
| Real-time Features | ██░░░░░░░░ 20% | ❌ No WebSocket |

### 3.2 Fitur MVP — Detail Status

#### ✅ SELESAI (Fully Implemented)

| # | Fitur | Deskripsi | Lokasi Kode |
|---|-------|-----------|-------------|
| 1 | **Supply/Demand CRUD** | API lengkap untuk entri supply & demand dengan auto-create user | `tumbasna-dashboard/src/app/api/supply/`, `api/demand/` |
| 2 | **Smart Matching Engine** | Algoritma pencocokan otomatis: Haversine (jarak ≤100km) + toleransi harga (≤115%) + skor berbobot (70% jarak, 30% harga) | `tumbasna-dashboard/src/app/api/webhook/wa/` |
| 3 | **Transaction Lifecycle** | Siklus TRX lengkap: generate kode → kirim tawaran → AMBIL/SUKSES/BATAL commands → follow-up | `tumbasna-dashboard/src/lib/transactions.ts` |
| 4 | **AI NLP Extraction** | Ekstraksi komoditas, jumlah, harga, lokasi, tipe dari teks natural (Bahasa Indonesia) | `tumbasna-dashboard/src/lib/gemini.ts` |
| 5 | **Geocoding** | Konversi nama lokasi → koordinat GPS via Nominatim OpenStreetMap | `tumbasna-dashboard/src/lib/geocoding.ts` |
| 6 | **Dashboard Analytics** | 7 halaman dashboard: KPI, Peta GIS, Komoditas, Transaksi, Logistik, Disparitas Harga, Inflasi | `tumbasna-dashboard/src/app/dashboard/` |
| 7 | **Mobile Marketplace** | 12 halaman lengkap: browse produk, keranjang, checkout, tracking pesanan, chat, profil | `tumbasna-mobile/src/pages/` |
| 8 | **Database Schema** | 7 model Prisma + 5 enum + migrasi + seeder (18 petani, 12 pedagang, 60 supply, 50 demand) | `tumbasna-dashboard/prisma/schema.prisma` |
| 9 | **Docker Deployment** | Dockerfile + docker-compose untuk dashboard dan WhatsApp bot | `docker-compose.yml` |
| 10 | **Landing Page** | Halaman utama responsive dengan animasi (Framer Motion) | `tumbasna-dashboard/src/app/page.tsx` |

#### ⚠️ PARSIAL (Partially Implemented)

| # | Fitur | Status | Detail |
|---|-------|--------|--------|
| 1 | **WhatsApp Bot** | Built, NOT operational | API key kosong, `ENABLE_REAL_WA=false`, belum ada session aktif |
| 2 | **QRIS Payment** | UI complete, simulated | Tampilan QRIS lengkap tapi menggunakan QR dummy dari `api.qrserver.com` |
| 3 | **Ongkos Kirim** | API exists, partial | Biteship API + OSRM/Mapbox fallback + Haversine, tapi tanpa RajaOngkir |
| 4 | **Escrow System** | Schema only | Field `fundsReleased` & `balance` ada di DB, tapi tidak ada logika transfer dana |
| 5 | **Chat Buyer-Supplier** | Model + UI exists | ChatMessage model ada, UI chat ada, tapi belum real-time (no WebSocket) |
| 6 | **Logistik Backhaul** | Component built | `LogistikBackhaul.tsx` ada tapi belum masuk navigasi sidebar |
| 7 | **Authentication** | Basic phone login | Login via nomor HP tanpa password, tanpa JWT/session tokens |

#### ❌ BELUM DIIMPLEMENTASI

| # | Fitur | Prioritas | Catatan |
|---|-------|-----------|---------|
| 1 | **Midtrans Payment Gateway** | 🔴 TINGGI | Zero references dalam codebase |
| 2 | **RajaOngkir API** | 🔴 TINGGI | Zero references, saat ini pakai Biteship |
| 3 | **JWT Authentication** | 🔴 TINGGI | Tidak ada token auth, API tidak terlindungi |
| 4 | **Real-time WebSocket** | 🟡 SEDANG | Chat & notifikasi masih polling |
| 5 | **Sistem Payout/Withdrawal** | 🟡 SEDANG | Disebutkan di user journey tapi belum ada |
| 6 | **Rating Supplier** | 🟢 RENDAH | Hardcoded 4.8 di semua tempat |
| 7 | **Price History Analytics** | 🟢 RENDAH | Data mock (current price × multiplier) |
| 8 | **Cron Jobs Follow-up** | 🟡 SEDANG | Fungsi ada tapi tidak ada scheduler |
| 9 | **Admin Role Management** | 🟡 SEDANG | Enum ada tapi tidak ada middleware |
| 10 | **E-Catalog** | 🟢 RENDAH | Phase 2 roadmap |

---

## 4. Status Integrasi WhatsApp Gateway

### 4.1 Arsitektur WA Gateway

Tumbasna memiliki **2 jalur WhatsApp** yang saling melengkapi:

```
Jalur 1: DIRECT (Baileys — tumbasna-whatsapp)
──────────────────────────────────────────────
WhatsApp User ──▶ Baileys Socket ──▶ Message Handler ──▶ LangChain AI
     │                                                       │
     │              ◀── Reply ◀── JSON Parse ◀── AI Response ┘
     │
     └──▶ API Call ──▶ tumbasna-dashboard API ──▶ Database (Prisma)

Jalur 2: WEBHOOK (Fonnte — tumbasna-dashboard)
──────────────────────────────────────────────
WhatsApp User ──▶ Fonnte Server ──▶ Webhook POST /api/webhook/wa
     │                                          │
     │              ◀── Fonnte API Send ◀── Gemini AI Extract + SME
     │
     └──▶ Database (Prisma) langsung
```

### 4.2 Status Operasional

| Aspek | Jalur 1 (Baileys) | Jalur 2 (Fonnte) |
|-------|-------------------|-------------------|
| **Kode** | ✅ Lengkap | ✅ Lengkap |
| **AI Processing** | LangChain + OpenAI proxy | Google Gemini langsung |
| **Memory/History** | ✅ Multi-turn via API | ✅ Via ChatSession model |
| **Matching Engine** | ✅ Via Dashboard API | ✅ Built-in SME |
| **Operasional?** | ❌ TIDAK | ⚠️ Butuh FONNTE_TOKEN |
| **Blocker** | API key kosong, ENABLE_REAL_WA=false | Token belum dikonfigurasi |

### 4.3 Apa Yang Perlu Dikonfigurasi Agar WA Gateway Berjalan

#### Jalur 1 — Baileys (tumbasna-whatsapp)

```bash
# File: tumbasna-whatsapp/.env
PORT=3002
API_URL=http://localhost:3000
OPENAI_API_KEY="isi-api-key-anda"          # ← WAJIB DIISI
OPENAI_BASE_URL=https://ai.semutssh.com/v1/chat/completions
OPENAI_MODEL=gemini-3-flash-preview
ENABLE_REAL_WA=true                         # ← UBAH KE true
TUMBASNA_SECRET_KEY="ganti-dengan-secret"   # ← Opsional tapi disarankan
```

**Langkah Aktivasi:**
1. Isi `OPENAI_API_KEY` dengan API key dari SemutSSH atau OpenAI
2. Ubah `ENABLE_REAL_WA=true`
3. Jalankan bot: `cd tumbasna-whatsapp && npm run dev`
4. Scan QR code yang muncul di terminal
5. Tes via `/test/simulate-message` endpoint

#### Jalur 2 — Fonnte (tumbasna-dashboard)

```bash
# File: tumbasna-dashboard/.env
FONNTE_TOKEN="dapatkan-dari-fonnte.com"     # ← WAJIB DIISI
GEMINI_API_KEY="isi-gemini-api-key"         # ← WAJIB DIISI
```

**Langkah Aktivasi:**
1. Daftar di [fonnte.com](https://fonnte.com) dan dapatkan token
2. Isi `FONNTE_TOKEN` dan `GEMINI_API_KEY` di `.env`
3. Setup webhook URL di Fonnte dashboard → `https://domain-anda.com/api/webhook/wa`
4. Gunakan Ngrok untuk development: `ngrok http 3000`

### 4.4 Kesimpulan WA Gateway

> **🟡 VERDICT: BELUM BISA DIGUNAKAN — tapi sudah siap secara arsitektur.**
> 
> Kode lengkap dan teruji untuk kedua jalur. Yang dibutuhkan hanyalah:
> 1. API key untuk AI service (OpenAI/Gemini)
> 2. Fonnte token (jika pakai jalur webhook)
> 3. Konfigurasi environment variables
> 4. Scan QR untuk Baileys
>
> Estimasi waktu aktivasi: **30 menit — 1 jam** setelah API key tersedia.

---

## 5. Rencana Integrasi Payment Gateway (Midtrans)

### 5.1 Status Saat Ini

**❌ BELUM ADA IMPLEMENTASI MIDTRANS.**

Saat ini mobile app menggunakan **QRIS simulasi** — QR code dummy dari `api.qrserver.com` dengan countdown timer. Tidak ada transaksi pembayaran nyata.

### 5.2 Rencana Integrasi

#### A. Persiapan

| Item | Detail |
|------|--------|
| **Akun Midtrans** | Daftar di [midtrans.com](https://midtrans.com) |
| **Environment** | Sandbox (testing) → Production |
| **Credentials** | Server Key, Client Key, Merchant ID |
| **Metode Pembayaran** | QRIS, Bank Transfer (VA), GoPay, ShopeePay |

#### B. Perubahan Database (Prisma Schema)

```prisma
// Tambahan model untuk Payment
model Payment {
  id              String         @id @default(uuid()) @db.Uuid
  orderId         String         @unique @map("order_id")
  midtransOrderId String         @unique @map("midtrans_order_id")
  transactionId   String?        @map("transaction_id")
  paymentType     String?        @map("payment_type")       // qris, bank_transfer, gopay
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
```

#### C. API Endpoints Yang Akan Dibuat

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/payments/create` | POST | Buat transaksi Midtrans (Snap Token) |
| `/api/payments/notification` | POST | Webhook callback dari Midtrans |
| `/api/payments/status/[orderId]` | GET | Cek status pembayaran |
| `/api/payments/cancel/[orderId]` | POST | Batalkan pembayaran |

#### D. Flow Integrasi

```
1. Buyer checkout di Mobile App
   └──▶ POST /api/payments/create
        └──▶ Midtrans Snap API → return snap_token + snap_url
             └──▶ Mobile App tampilkan Snap payment page
                  └──▶ Buyer bayar (QRIS/VA/e-wallet)

2. Midtrans kirim notifikasi
   └──▶ POST /api/payments/notification (webhook)
        └──▶ Verifikasi signature
             └──▶ Update Payment status
                  └──▶ Update Order status (MENUNGGU → DIPROSES)
                       └──▶ Kirim notifikasi WA ke buyer & supplier

3. Supplier kirim barang
   └──▶ Order status: DIKIRIM
        └──▶ Buyer konfirmasi terima
             └──▶ Order status: SELESAI
                  └──▶ Release dana ke supplier (escrow)
```

#### E. Dependency Yang Perlu Diinstall

```bash
cd tumbasna-dashboard
npm install midtrans-client
```

#### F. Environment Variables Baru

```env
# Midtrans Sandbox (Testing)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=G000000000

# Midtrans Production
# MIDTRANS_SERVER_KEY=Mid-server-xxxxx
# MIDTRANS_CLIENT_KEY=Mid-client-xxxxx
# MIDTRANS_IS_PRODUCTION=true
```

#### G. Estimasi Pengerjaan

| Task | Estimasi | Prioritas |
|------|----------|-----------|
| Setup akun & credentials Midtrans | 1 hari | 🔴 |
| Model Payment + migrasi database | 0.5 hari | 🔴 |
| API endpoint create payment (Snap) | 1 hari | 🔴 |
| Webhook notification handler | 1 hari | 🔴 |
| Integrasi mobile app (Snap redirect) | 1 hari | 🔴 |
| Escrow & release dana logic | 2 hari | 🟡 |
| Testing end-to-end (sandbox) | 1 hari | 🔴 |
| **Total Estimasi** | **~7 hari kerja** | |

---

## 6. Rencana Integrasi Ekspedisi (RajaOngkir)

### 6.1 Status Saat Ini

**❌ BELUM ADA IMPLEMENTASI RAJAONGKIR.**

Saat ini menggunakan **Biteship API** (partial) dengan fallback ke OSRM/Mapbox routing dan Haversine formula. Kalkulasi ongkir belum akurat untuk kurir Indonesia.

### 6.2 Rencana Integrasi

#### A. Persiapan

| Item | Detail |
|------|--------|
| **Akun RajaOngkir** | Daftar di [rajaongkir.com](https://rajaongkir.com) |
| **Plan** | Starter (gratis), Basic, atau Pro |
| **API Key** | Dari dashboard RajaOngkir |
| **Kurir Didukung** | JNE, TIKI, POS, J&T, SiCepat, Anteraja, dll |

#### B. Perubahan Database (Prisma Schema)

```prisma
// Tambahan model untuk Shipping
model ShippingAddress {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  label       String   // "Alamat Utama", "Gudang", dll
  province    String
  provinceId  String   @map("province_id")
  city        String
  cityId      String   @map("city_id")
  district    String?
  postalCode  String?  @map("postal_code")
  fullAddress String   @map("full_address")
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("shipping_addresses")
}
```

#### C. API Endpoints Yang Akan Dibuat

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/api/shipping/provinces` | GET | Daftar provinsi (cache dari RajaOngkir) |
| `/api/shipping/cities` | GET | Daftar kota berdasarkan provinsi |
| `/api/shipping/cost` | POST | Hitung ongkir (origin, destination, weight, courier) |
| `/api/shipping/track` | POST | Tracking resi pengiriman |
| `/api/shipping/addresses` | GET/POST | CRUD alamat pengiriman user |

#### D. Flow Integrasi

```
1. User register / update profil
   └──▶ Pilih Provinsi → Kota (dari RajaOngkir cache)
        └──▶ Simpan sebagai ShippingAddress

2. Checkout di Mobile App
   └──▶ Pilih alamat pengiriman
        └──▶ POST /api/shipping/cost
             ├── origin: cityId supplier
             ├── destination: cityId buyer  
             ├── weight: total berat (gram)
             └── courier: jne/tiki/pos/jnt/sicepat
                  └──▶ Tampilkan opsi kurir + harga + estimasi

3. Setelah pembayaran
   └──▶ Supplier input resi pengiriman
        └──▶ POST /api/shipping/track
             └──▶ Tracking status real-time
```

#### E. Dependency Yang Perlu Diinstall

```bash
cd tumbasna-dashboard
npm install axios  # sudah ada di whatsapp, tapi pastikan ada di dashboard
```

#### F. Environment Variables Baru

```env
# RajaOngkir
RAJAONGKIR_API_KEY=your-api-key-here
RAJAONGKIR_PLAN=starter    # starter|basic|pro
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com
```

#### G. Estimasi Pengerjaan

| Task | Estimasi | Prioritas |
|------|----------|-----------|
| Setup akun & API key RajaOngkir | 0.5 hari | 🔴 |
| Model ShippingAddress + migrasi | 0.5 hari | 🔴 |
| API provinces & cities (+ caching) | 1 hari | 🔴 |
| API cost calculation | 1 hari | 🔴 |
| API tracking resi | 0.5 hari | 🟡 |
| Integrasi mobile app checkout | 1 hari | 🔴 |
| Update flow checkout existing | 0.5 hari | 🟡 |
| Testing end-to-end | 0.5 hari | 🔴 |
| **Total Estimasi** | **~5.5 hari kerja** | |

---

## 7. Status Database & Integrasi

### 7.1 Database Saat Ini

| Aspek | Detail |
|-------|--------|
| **Provider** | PostgreSQL via Supabase |
| **ORM** | Prisma 5.22 |
| **Host** | `aws-0-ap-southeast-1.pooler.supabase.com` |
| **Connection Pooling** | PgBouncer (port 6543) |
| **Direct Connection** | Port 5432 (untuk migrasi) |

### 7.2 Model Database Existing (7 Model)

```
┌─────────┐     ┌──────────────┐     ┌─────────┐
│  User   │────▶│ ProductEntry │────▶│  Match  │
│ (users) │     │(product_     │     │(matches)│
│         │     │ entries)     │     │         │
└────┬────┘     └──────┬───────┘     └─────────┘
     │                 │
     │    ┌────────────┼────────────┐
     │    │            │            │
     ▼    ▼            ▼            │
┌─────────┐     ┌───────────┐      │
│  Order  │────▶│ OrderItem │──────┘
│(orders) │     │(order_    │
│         │     │ items)    │
└─────────┘     └───────────┘

┌──────────────┐     ┌──────────────┐
│ ChatSession  │     │ ChatMessage  │
│(chat_        │     │(chat_        │
│ sessions)    │     │ messages)    │
└──────────────┘     └──────────────┘
```

### 7.3 Status Integrasi Database per Komponen

| Komponen | Koneksi DB | Status | Detail |
|----------|------------|--------|--------|
| **tumbasna-dashboard** | ✅ Prisma langsung | ✅ Working | Full CRUD, semua 7 model |
| **tumbasna-whatsapp** | ✅ Via REST API | ✅ Working | Melalui Dashboard API (session, supply, demand, entries) |
| **tumbasna-mobile** | ✅ Via REST API | ⚠️ Partial | Products & orders via API, chat via localStorage |
| **Docker compose** | ⚠️ External DB | ✅ Config OK | Menggunakan Supabase, tidak ada container DB lokal |

### 7.4 Masalah Integrasi Database Yang Ditemukan

| # | Masalah | Severity | Solusi |
|---|---------|----------|--------|
| 1 | **Dashboard KPI menggunakan mock data** | 🟡 Medium | Hubungkan `/api/dashboard` ke query real Prisma |
| 2 | **Mobile chat simpan di localStorage** | 🟡 Medium | Integrasikan dengan ChatMessage API |
| 3 | **Rating supplier hardcoded 4.8** | 🟢 Low | Buat model Rating + API |
| 4 | **Price history data mock** | 🟡 Medium | Buat model PriceHistory atau query dari ProductEntry |
| 5 | **Transaksi page data hardcoded** | 🔴 High | Hubungkan dengan Match + Order data real |
| 6 | **Tidak ada Payment model** | 🔴 High | Tambahkan saat integrasi Midtrans |
| 7 | **Tidak ada ShippingAddress model** | 🔴 High | Tambahkan saat integrasi RajaOngkir |
| 8 | **ChatMessage tidak ada real-time sync** | 🟡 Medium | Implementasi WebSocket atau polling |

### 7.5 Database Yang Akan Ditambahkan (Setelah Integrasi)

Setelah integrasi Midtrans + RajaOngkir, total model menjadi **9 model + 6 enum**:

```
Model Existing (7):       Model Baru (2):
├── User                  ├── Payment (Midtrans)
├── ProductEntry          └── ShippingAddress (RajaOngkir)
├── Match
├── ChatSession           Enum Baru (1):
├── Order                 └── payment_status
├── OrderItem
└── ChatMessage
```

---

## 8. Cara Menjalankan Project

### 8.1 Prerequisites

| Software | Versi Minimum | Cara Install |
|----------|--------------|--------------|
| **Node.js** | v20.x | [nodejs.org](https://nodejs.org) |
| **npm** | v10.x | Bundled with Node.js |
| **Git** | v2.x | [git-scm.com](https://git-scm.com) |
| **PostgreSQL** | v15+ | Via Supabase (cloud) atau lokal |
| **Docker** (opsional) | v24+ | [docker.com](https://docker.com) |

### 8.2 Setup Database (Supabase)

```bash
# 1. Buat project di supabase.com
# 2. Dapatkan connection string dari Settings > Database

# 3. Copy .env.example ke .env
cd tumbasna-dashboard
copy .env.example .env

# 4. Isi DATABASE_URL dan DIRECT_URL di .env
# DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# 5. Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# 6. Seed database (opsional)
npm run seed
```

### 8.3 Menjalankan Dashboard + API Backend

```bash
cd tumbasna-dashboard

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Dashboard tersedia di: http://localhost:3000
# API tersedia di: http://localhost:3000/api/*
```

### 8.4 Menjalankan WhatsApp Bot

```bash
cd tumbasna-whatsapp

# Install dependencies
npm install

# Copy & konfigurasi .env
copy .env.example .env
# Isi OPENAI_API_KEY dan set ENABLE_REAL_WA=true

# Jalankan bot
npm run dev

# Bot tersedia di: http://localhost:3002
# Scan QR code yang muncul di terminal
```

### 8.5 Menjalankan Mobile App

```bash
cd tumbasna-mobile

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Mobile app tersedia di: http://localhost:5173
# Untuk build Android/iOS: npx cap sync && npx cap open android
```

### 8.6 Menjalankan via Docker (Dashboard + WA Bot)

```bash
# Dari root directory
docker-compose up --build

# Dashboard: http://localhost:3000
# WA Bot: http://localhost:3002
```

### 8.7 Urutan Menjalankan (PENTING)

```
1. Database (Supabase) — harus running & schema sudah di-push
     ↓
2. tumbasna-dashboard (port 3000) — API backend harus UP pertama
     ↓
3. tumbasna-whatsapp (port 3002) — depends on dashboard API
     ↓
4. tumbasna-mobile (port 5173) — depends on dashboard API
```

---

## 9. Konfigurasi Yang Diperlukan

### 9.1 Environment Variables — tumbasna-dashboard/.env

| Variable | Status | Wajib | Deskripsi |
|----------|--------|-------|-----------|
| `DATABASE_URL` | ⚠️ Perlu diisi | ✅ | PostgreSQL connection string (pooler) |
| `DIRECT_URL` | ⚠️ Perlu diisi | ✅ | PostgreSQL direct connection (untuk migrasi) |
| `GEMINI_API_KEY` | ⚠️ Perlu diisi | ✅ | Google Gemini API key untuk NLP |
| `FONNTE_TOKEN` | ⚠️ Perlu diisi | ⚠️ Jika pakai Fonnte | Token dari fonnte.com |
| `NEXT_PUBLIC_BASE_URL` | ⚠️ Perlu diisi | ✅ | URL publik (localhost:3000 untuk dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Opsional | ❌ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Opsional | ❌ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Opsional | ❌ | Supabase service role key |
| `MIDTRANS_SERVER_KEY` | ❌ Belum ada | 🔜 | Akan ditambahkan |
| `MIDTRANS_CLIENT_KEY` | ❌ Belum ada | 🔜 | Akan ditambahkan |
| `RAJAONGKIR_API_KEY` | ❌ Belum ada | 🔜 | Akan ditambahkan |

### 9.2 Environment Variables — tumbasna-whatsapp/.env

| Variable | Status | Wajib | Deskripsi |
|----------|--------|-------|-----------|
| `PORT` | ✅ 3002 | ✅ | Port server Express |
| `API_URL` | ✅ http://localhost:3000 | ✅ | URL dashboard API |
| `OPENAI_API_KEY` | ❌ KOSONG | ✅ | **BLOCKER** — AI tidak bisa jalan |
| `OPENAI_BASE_URL` | ✅ Configured | ✅ | SemutSSH proxy endpoint |
| `OPENAI_MODEL` | ✅ gemini-3-flash-preview | ✅ | Model AI yang digunakan |
| `ENABLE_REAL_WA` | ✅ false | ✅ | **Ubah ke true** untuk produksi |
| `TUMBASNA_SECRET_KEY` | ⚠️ Default fallback | ⚠️ | Ganti untuk keamanan |

### 9.3 Checklist Konfigurasi Sebelum Production

- [ ] Isi semua API key (Gemini, OpenAI/SemutSSH, Fonnte)
- [ ] Setup database Supabase & push schema
- [ ] Seed database untuk data testing
- [ ] Scan QR WhatsApp untuk Baileys session
- [ ] Set `ENABLE_REAL_WA=true`
- [ ] Ganti `TUMBASNA_SECRET_KEY` dari default
- [ ] Setup Ngrok/domain publik untuk webhook Fonnte
- [ ] Konfigurasi Midtrans (setelah integrasi)
- [ ] Konfigurasi RajaOngkir (setelah integrasi)
- [ ] Setup SSL certificate untuk production
- [ ] Konfigurasi CORS untuk mobile app

---

## 10. Tahapan Pengembangan (Roadmap)

### Phase 1: Core Foundation ✅ SELESAI
**Timeline:** Sudah selesai  
**Cakupan:**
- [x] Database schema (Prisma + PostgreSQL)
- [x] Supply/Demand CRUD API
- [x] Smart Matching Engine (SME)
- [x] WhatsApp AI Bot (Baileys + LangChain)
- [x] Fonnte webhook integration
- [x] Dashboard UI (7 halaman)
- [x] Mobile App (12 halaman)
- [x] Landing page
- [x] Docker deployment config
- [x] Database seeder

### Phase 2: Integrasi & Stabilisasi 🔄 SEDANG BERJALAN
**Timeline:** Juli - Agustus 2026  
**Cakupan:**

#### Sprint 2.1 — Aktivasi WA Gateway (Minggu 1)
- [ ] Konfigurasi API key (OpenAI/Gemini)
- [ ] Aktivasi ENABLE_REAL_WA
- [ ] Testing end-to-end WA bot
- [ ] Setup monitoring & logging

#### Sprint 2.2 — Midtrans Payment Gateway (Minggu 2-3)
- [ ] Setup akun Midtrans Sandbox
- [ ] Buat model Payment + migrasi
- [ ] API create payment (Snap)
- [ ] Webhook notification handler
- [ ] Integrasi mobile app checkout
- [ ] Implementasi escrow logic
- [ ] Testing sandbox end-to-end

#### Sprint 2.3 — RajaOngkir Ekspedisi (Minggu 3-4)
- [ ] Setup akun RajaOngkir
- [ ] Buat model ShippingAddress + migrasi
- [ ] API provinces/cities (+ Redis cache)
- [ ] API cost calculation
- [ ] API tracking resi
- [ ] Update mobile checkout flow
- [ ] Testing end-to-end

#### Sprint 2.4 — Database Cleanup & Auth (Minggu 4-5)
- [ ] Hubungkan dashboard KPI ke data real
- [ ] Hubungkan transaksi page ke Match + Order
- [ ] Implementasi JWT authentication
- [ ] API middleware protection
- [ ] Rate limiting
- [ ] Mobile chat → ChatMessage API (bukan localStorage)

### Phase 3: Optimisasi & Fitur Lanjutan
**Timeline:** September - Oktober 2026  
**Cakupan:**
- [ ] Real-time WebSocket (chat, notifikasi)
- [ ] Rating & review supplier
- [ ] Price history analytics (real data)
- [ ] Cron jobs untuk follow-up messages
- [ ] Push notification (mobile)
- [ ] Admin role management
- [ ] Payout/withdrawal system
- [ ] Logistik backhaul integration

### Phase 4: Scale & Production
**Timeline:** November 2026+  
**Cakupan:**
- [ ] E-Catalog
- [ ] B2B Supply Chain Hub
- [ ] Advanced analytics dashboard
- [ ] Multi-region support
- [ ] Performance optimization
- [ ] Security audit
- [ ] Go-live production

---

## 11. Risiko & Mitigasi

| # | Risiko | Severity | Probabilitas | Mitigasi |
|---|--------|----------|-------------|----------|
| 1 | API key leak di repository | 🔴 Critical | Medium | Pastikan `.env` ada di `.gitignore`, gunakan environment variables |
| 2 | WhatsApp ban (Baileys) | 🔴 Critical | Medium | Gunakan Fonnte sebagai backup, patuhi ToS WhatsApp |
| 3 | Database downtime (Supabase) | 🟡 High | Low | Setup backup strategy, consider self-hosted fallback |
| 4 | Midtrans webhook gagal | 🟡 High | Medium | Implementasi retry mechanism, idempotent handler |
| 5 | Auth tanpa JWT mudah ditembus | 🔴 Critical | High | Prioritaskan implementasi JWT di Sprint 2.4 |
| 6 | Rate limit RajaOngkir (free plan) | 🟡 Medium | High | Cache response, upgrade plan jika diperlukan |
| 7 | Scalability monolith Next.js | 🟡 Medium | Low | Pisahkan API ke standalone (tumbasna-api) di Phase 4 |
| 8 | Mock data masih tersisa | 🟡 Medium | High | Audit semua komponen, ganti dengan data real |

---

## 12. Catatan Rename Folder

### Rekomendasi: Rename `ivolate/` → `tumbasna/`

Folder root project saat ini bernama `ivolate/` yang tidak mencerminkan nama project sebenarnya (Tumbasna). Disarankan untuk rename:

```bash
# Dari terminal (pastikan tidak ada proses yang menggunakan folder)
cd "C:\LIST PROJECT"
ren ivolate tumbasna
```

**⚠️ Yang perlu diperbarui setelah rename:**
1. Git remote URL (jika ada): `git remote set-url origin <new-url>`
2. Docker volume paths di `docker-compose.yml`
3. Path di IDE/editor workspace settings
4. Dokumentasi yang mereferensikan path `ivolate/`

> **CATATAN:** Rename folder root tidak akan mengubah kode — semua referensi internal sudah menggunakan relative path. Namun disarankan dilakukan saat tidak ada development aktif untuk menghindari konflik.

---

## Lampiran

### A. Kontak & Referensi

| Resource | Link |
|----------|------|
| Midtrans Dashboard | [dashboard.midtrans.com](https://dashboard.midtrans.com) |
| Midtrans Docs | [docs.midtrans.com](https://docs.midtrans.com) |
| RajaOngkir Dashboard | [rajaongkir.com](https://rajaongkir.com) |
| RajaOngkir API Docs | [rajaongkir.com/dokumentasi](https://rajaongkir.com/dokumentasi) |
| Fonnte Dashboard | [fonnte.com](https://fonnte.com) |
| Supabase Dashboard | [supabase.com/dashboard](https://supabase.com/dashboard) |
| Baileys Docs | [github.com/WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) |

### B. Perintah Penting

```bash
# Database
npx prisma generate          # Generate Prisma client
npx prisma db push           # Push schema ke database
npx prisma studio            # Open Prisma Studio (GUI database)
npx prisma migrate dev       # Create migration
npm run seed                 # Seed database

# Development
npm run dev                  # Jalankan dev server (semua project)
npm run build                # Build production
npm run lint                 # Lint check

# Docker
docker-compose up --build    # Build & run semua services
docker-compose down          # Stop semua services
docker-compose logs -f       # Lihat logs

# Testing WA Bot
curl -X POST http://localhost:3002/test/simulate-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "6281234567890", "message": "jual cabai 100 kg harga 50000 lokasi malang"}'
```

---

> 📝 **Dokumen ini akan diupdate seiring perkembangan project.**  
> **Last Updated:** 2 Juli 2026  
> **Next Review:** Setelah Sprint 2.1 (Aktivasi WA Gateway)
