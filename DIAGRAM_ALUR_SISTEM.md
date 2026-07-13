# 🔄 DIAGRAM ALUR DATA & INTERAKSI SISTEM TUMBASNA

> **Supplement Document untuk ANALISIS_STRUKTUR_PROJECT.md**  
> **Tanggal:** 12 Juli 2026

---

## 1. ARSITEKTUR SISTEM LENGKAP

\\\
┌─────────────────────────────────────────────────────────────────────┐
│                        TUMBASNA ECOSYSTEM                            │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Internet   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
    ┌─────────────┐ ┌──────────┐ ┌──────────────┐
    │  Landing    │ │Dashboard │ │ Mobile App   │
    │  Page       │ │ (Admin)  │ │ (Buyer)      │
    │  Port 3000  │ │Port 3000 │ │ Port 5173    │
    └─────────────┘ └─────┬────┘ └──────┬───────┘
                          │              │
                          │    REST API  │
                          │   (29 eps)   │
                          ▼              ▼
                    ┌──────────────────────┐
                    │   Next.js Backend    │
                    │   (API Routes)       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      ┌──────────────┐  ┌───────────┐  ┌──────────────┐
      │ PostgreSQL   │  │  Gemini   │  │  Midtrans    │
      │   Database   │  │    AI     │  │  Payment     │
      └──────────────┘  └───────────┘  └──────────────┘
              ▲
              │
              │ Webhook
              │
      ┌───────┴──────────┐
      │  WA Bot Server   │
      │  (Node.js)       │
      │  Port 3002       │
      └────────┬─────────┘
               │
               ▼
      ┌─────────────────┐
      │  Baileys WA     │
      │  Multi-Device   │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │  Petani/Supplier│
      │  (WhatsApp)     │
      └─────────────────┘
\\\

---

## 2. ALUR DATA SUPPLY (Petani Input via WhatsApp)

\\\
┌─────────────┐
│   PETANI    │ "Jual cabai 100kg harga 50rb lokasi Brebes"
│  (WhatsApp) │
└──────┬──────┘
       │ 1. Kirim pesan
       ▼
┌──────────────────┐
│   Baileys WA     │ Terima pesan raw
│   Connection     │
└──────┬───────────┘
       │ 2. Forward ke handler
       ▼
┌──────────────────┐
│  Message Handler │ Route ke AI Agent
└──────┬───────────┘
       │ 3. Extract data
       ▼
┌──────────────────┐
│   AI Agent       │ Parse menggunakan LLM
│ Gemini/Groq LLM  │ → {intent: "SUPPLY", commodity: "Cabai", ...}
└──────┬───────────┘
       │ 4. Structured JSON
       ▼
┌──────────────────┐
│  API Service     │ POST /api/webhook/wa
└──────┬───────────┘
       │ 5. HTTP Request
       ▼
┌──────────────────┐
│ Dashboard API    │ Validasi + Geocoding
│  /webhook/wa     │
└──────┬───────────┘
       │ 6. Save to DB
       ▼
┌──────────────────┐
│  PostgreSQL      │ INSERT ProductEntry
│  (Prisma)        │ status: ACTIVE
└──────┬───────────┘
       │ 7. Run Matching
       ▼
┌──────────────────┐
│ Matching Engine  │ Cari Demand yang cocok
│     (SME)        │ Algoritma: Haversine + Price
└──────┬───────────┘
       │ 8a. No match → End
       │ 8b. Match found ↓
       ▼
┌──────────────────┐
│  Create Match    │ INSERT Match table
│  Record          │ code: TRX-XXXX
└──────┬───────────┘
       │ 9. Notify
       ▼
┌──────────────────┐
│  WA Bot          │ Kirim notifikasi
│  Notification    │ "Penawaran aktif! TRX-XXXX"
└──────┬───────────┘
       │ 10. WhatsApp message
       ▼
┌──────────────────┐
│   PETANI         │ Terima konfirmasi
└──────────────────┘
\\\

---

## 3. ALUR DATA DEMAND (Buyer via Mobile App)

\\\
┌─────────────┐
│   BUYER     │ Buka Mobile App
│ (Mobile App)│
└──────┬──────┘
       │ 1. Browse marketplace
       ▼
┌──────────────────┐
│  Pasar Screen    │ GET /api/products
└──────┬───────────┘
       │ 2. API call
       ▼
┌──────────────────┐
│ Dashboard API    │ SELECT * FROM ProductEntry
│  /api/products   │ WHERE status = ACTIVE
└──────┬───────────┘
       │ 3. Return products
       ▼
┌──────────────────┐
│  Filter & Sort   │ By distance, price, category
│  (Client side)   │
└──────┬───────────┘
       │ 4. Display products
       ▼
┌──────────────────┐
│  Product Card    │ User klik produk
└──────┬───────────┘
       │ 5. Navigate to detail
       ▼
┌──────────────────┐
│ DetailProduk     │ Tampil info lengkap
│    Screen        │ Harga, lokasi, supplier
└──────┬───────────┘
       │ 6. Add to cart
       ▼
┌──────────────────┐
│  Cart Context    │ Save to localStorage
│  (AppContext)    │
└──────┬───────────┘
       │ 7. Checkout
       ▼
┌──────────────────┐
│ Checkout Screen  │ Pilih alamat + kurir
└──────┬───────────┘
       │ 8. Calculate shipping
       ▼
┌──────────────────┐
│ /api/shipping    │ GET shipping cost
│    /cost         │ (RajaOngkir / Manual)
└──────┬───────────┘
       │ 9. Display total
       ▼
┌──────────────────┐
│  Bayar Button    │ User klik bayar
└──────┬───────────┘
       │ 10. Create order
       ▼
┌──────────────────┐
│ POST /api/orders │ INSERT Order + OrderItem
└──────┬───────────┘
       │ 11. Create payment
       ▼
┌──────────────────┐
│ POST /api/       │ Request Snap Token
│ payments/create  │ dari Midtrans
└──────┬───────────┘
       │ 12. Return snap_token
       ▼
┌──────────────────┐
│ PembayaranQris   │ Display QR Code
│    Screen        │ (Midtrans Snap)
└──────┬───────────┘
       │ 13. User scan & bayar
       ▼
┌──────────────────┐
│  Midtrans        │ Process payment
│  Gateway         │
└──────┬───────────┘
       │ 14. Webhook callback
       ▼
┌──────────────────┐
│ POST /api/       │ UPDATE Payment status
│ payments/        │ UPDATE Order status
│ notification     │ → DIPROSES
└──────┬───────────┘
       │ 15. Notify supplier
       ▼
┌──────────────────┐
│  WA Bot          │ Kirim notif ke Petani
│  Notification    │ "Pesanan baru! Siapkan barang"
└──────┬───────────┘
       │ 16. WhatsApp message
       ▼
┌──────────────────┐
│   PETANI         │ Terima notifikasi
└──────────────────┘
\\\

---

## 4. DATABASE RELATIONSHIP DIAGRAM

\\\
┌─────────────┐
│    User     │
│             │
│ - id (PK)   │
│ - phone     │
│ - name      │
│ - role      │◄──────┐
│ - balance   │       │
└─────┬───────┘       │
      │               │
      │ 1:N           │ 1:N
      │               │
      ▼               │
┌──────────────────┐  │
│  ProductEntry    │  │
│                  │  │
│ - id (PK)        │  │
│ - userId (FK)────┼──┘
│ - type           │
│ - commodity      │
│ - qty            │
│ - price          │
│ - location       │
│ - lat, lng       │
│ - status         │
└────┬─────┬───────┘
     │     │
     │ 1:N │ 1:N
     │     │
     ▼     ▼
┌─────────────────────┐
│      Match          │
│                     │
│ - id (PK)           │
│ - code (UNIQUE)     │
│ - supplyEntryId(FK)─┼──┐
│ - demandEntryId(FK)─┼──┤
│ - status            │  │
└─────────────────────┘  │
                         │
                         │
┌─────────────┐          │
│   Order     │          │
│             │          │
│ - id (PK)   │          │
│ - buyerId───┼──────────┘
│ - status    │
│ - total     │
└─────┬───────┘
      │
      │ 1:N
      │
      ▼
┌──────────────────┐
│   OrderItem      │
│                  │
│ - id (PK)        │
│ - orderId (FK)   │
│ - productId (FK) │
│ - qty            │
│ - price          │
└──────────────────┘

┌─────────────┐
│   Payment   │
│             │
│ - id (PK)   │
│ - orderId ──┼──┐
│ - status    │  │ 1:1
│ - snapToken │  │
└─────────────┘  │
                 │
         ┌───────┘
         │
         ▼
    (Order table)
\\\

---

## 5. STATE MACHINE: ORDER STATUS

\\\
┌─────────────────────┐
│ MENUNGGU_PEMBAYARAN │ ← Initial state
└──────────┬──────────┘
           │
           │ Payment success (Midtrans webhook)
           ▼
┌─────────────────────┐
│     DIPROSES        │ ← Supplier prepare goods
└──────────┬──────────┘
           │
           │ Shipping started
           ▼
┌─────────────────────┐
│      DIKIRIM        │ ← In transit
└──────────┬──────────┘
           │
           │ Buyer confirm received
           ▼
┌─────────────────────┐
│      SELESAI        │ ← Terminal state (funds released)
└─────────────────────┘

           ┌──────────────┐
           │  DIBATALKAN  │ ← Can cancel from any state
           └──────────────┘
\\\

---

## 6. MATCHING ENGINE ALGORITHM

\\\python
# Pseudocode Smart Matching Engine

function findBestMatch(newEntry):
    # Step 1: Get opposite type candidates
    candidates = DB.query(
        type = OPPOSITE(newEntry.type),
        commodity = newEntry.commodity,
        status = ACTIVE,
        userId != newEntry.userId
    )
    
    validCandidates = []
    
    # Step 2: Filter by distance & price
    for candidate in candidates:
        # Check coordinates exist
        if not (candidate.lat and candidate.lng):
            continue
            
        # Calculate distance (Haversine)
        distance = haversine(
            newEntry.lat, newEntry.lng,
            candidate.lat, candidate.lng
        )
        
        # Filter: Max 100 km
        if distance > MAX_DISTANCE_KM:
            continue
            
        # Calculate price ratio
        if newEntry.type == SUPPLY:
            ratio = newEntry.price / candidate.price
        else:
            ratio = candidate.price / newEntry.price
            
        # Filter: Max 115% premium
        if ratio > 1.15:
            continue
            
        # Calculate weighted score
        distScore = distance / MAX_DISTANCE_KM  # 0-1
        priceScore = max(0, (ratio - 1) / 0.15)  # 0-1
        
        score = 0.7 * distScore + 0.3 * priceScore
        
        validCandidates.append({
            candidate: candidate,
            score: score,
            distance: distance
        })
    
    # Step 3: Sort by score (ascending)
    validCandidates.sort(by: score)
    
    # Step 4: Return best match
    if validCandidates.isEmpty():
        return null
    else:
        return validCandidates[0]
\\\

---

## 7. API AUTHENTICATION FLOW

\\\
┌─────────────┐
│   Client    │ Login request
└──────┬──────┘
       │ POST /api/auth/login
       │ {phone, password}
       ▼
┌──────────────────┐
│  Login Handler   │ Validate credentials
└──────┬───────────┘
       │
       │ User found?
       ├─── NO ──→ Return 401
       │
       └─── YES ───┐
                   ▼
            ┌──────────────┐
            │ Create Token │ (Currently: Simple object)
            └──────┬───────┘
                   │
                   │ TODO: JWT implementation
                   ▼
            ┌──────────────┐
            │ Return user  │ {id, name, phone, role}
            │    object    │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │   Client     │ Save to localStorage
            │  (AppContext)│
            └──────────────┘
\\\

**⚠️ Security Note:** 
- Current auth: Simple localStorage (development)
- Phase 2.4: Implement JWT with httpOnly cookies
- Production: Add rate limiting & refresh tokens

---

## 8. DEPLOYMENT ARCHITECTURE

\\\
┌─────────────────────────────────────────────┐
│           Production Server(s)               │
│  (AWS / GCP / DigitalOcean / Vercel)        │
└─────────────────────────────────────────────┘
                    │
                    │ Docker Compose
                    ▼
        ┌───────────────────────┐
        │  Reverse Proxy        │
        │  (Nginx / Caddy)      │
        └───────┬───────────────┘
                │
                │ Routes by domain
                │
    ┌───────────┼────────────┐
    │           │            │
    ▼           ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Landing│  │Dashboard│ │Mobile  │
│ :3000  │  │ :3000  │  │ :3001  │
└────────┘  └───┬────┘  └───┬────┘
                │            │
                └─────┬──────┘
                      │
                      ▼
            ┌──────────────────┐
            │  Next.js API     │
            │  (Backend)       │
            └────┬──────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌─────────┐  ┌────────┐
│ Supabase│ │Midtrans │  │ WA Bot │
│   DB    │  │ Payment │  │ :3002  │
└─────────┘ └─────────┘  └────────┘
\\\

---

## 9. TECHNOLOGY DECISION MATRIX

| Requirement | Technology | Rationale |
|-------------|-----------|-----------|
| **Backend Framework** | Next.js 16 | Modern, SSR, API routes, easy deployment |
| **Database** | PostgreSQL | Relational, ACID, geospatial support |
| **ORM** | Prisma | Type-safe, migrations, great DX |
| **Mobile** | Ionic React | Cross-platform, native feel, fast dev |
| **WhatsApp** | Baileys | Free, no API cost, multi-device |
| **AI/NLP** | Gemini/Groq | Powerful, affordable, Indonesian support |
| **Maps** | Leaflet + OSM | Free, no API limits, customizable |
| **Payment** | Midtrans | Indonesian market leader, good docs |
| **State Management** | React Context | Simple, built-in, sufficient for MVP |
| **Styling** | Tailwind CSS | Utility-first, fast, consistent |

---

## 10. PERFORMANCE CONSIDERATIONS

### Database Optimization
- **Indexes** pada: phoneNumber, commodity, status, lat/lng
- **Connection Pooling** via Supabase/PgBouncer
- **Query Optimization** dengan Prisma select

### API Performance
- **Pagination** untuk list endpoints (default: 20 items)
- **Caching** Redis untuk settings & commodity list
- **Rate Limiting** 100 req/min per IP

### Mobile App
- **Lazy Loading** untuk images
- **Virtual Scrolling** untuk long lists
- **Offline Mode** dengan localStorage fallback

### WhatsApp Bot
- **Message Queue** untuk high volume
- **Session Cleanup** otomatis setelah 24h inactive
- **Fallback AI** Groq → Gemini untuk reliability

---

**Document prepared by:** AI Assistant  
**Date:** 11 Juli 2026  
**Related to:** ANALISIS_STRUKTUR_PROJECT.md
