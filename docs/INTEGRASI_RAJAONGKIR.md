# 🚚 Rencana Integrasi RajaOngkir Ekspedisi

> **Tanggal:** 2 Juli 2026  
> **Status:** ❌ Belum Diimplementasi  
> **Prioritas:** 🔴 Tinggi  
> **Estimasi:** 5.5 hari kerja

---

## Status Saat Ini

- **Ongkir endpoint:** `POST /api/logistik/ongkir` ada tapi menggunakan Biteship API + OSRM/Mapbox fallback + Haversine
- **RajaOngkir:** Zero references dalam codebase
- **Mobile checkout:** Pilihan kurir ada tapi harga ongkir mock/kalkulasi sederhana
- **Tracking:** Belum ada tracking resi real

---

## Rencana Implementasi

### 1. Persiapan Akun

1. Daftar di [rajaongkir.com](https://rajaongkir.com)
2. Pilih plan:
   - **Starter (Gratis):** 3 kurir (JNE, POS, TIKI), 100 req/hari
   - **Basic (Rp 100rb/bulan):** 11 kurir, unlimited request
   - **Pro (Rp 250rb/bulan):** 22 kurir + tracking + internasional
3. Dapatkan API Key dari dashboard

### 2. Install Dependency

```bash
cd tumbasna-dashboard
# axios sudah ada via dependency lain, tapi pastikan:
npm install axios
```

### 3. Tambah Environment Variables

```env
# tumbasna-dashboard/.env
RAJAONGKIR_API_KEY=your-api-key-here
RAJAONGKIR_PLAN=starter
RAJAONGKIR_BASE_URL=https://api.rajaongkir.com
```

### 4. Tambah Model Database

```prisma
// Tambahkan di prisma/schema.prisma

model ShippingAddress {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  label       String   // "Alamat Utama", "Gudang"
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

// Update User model - tambah relasi:
// shippingAddresses ShippingAddress[]
```

### 5. Buat Library RajaOngkir

```typescript
// src/lib/rajaongkir.ts

import axios from 'axios';

const RAJAONGKIR_KEY = process.env.RAJAONGKIR_API_KEY;
const BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://api.rajaongkir.com';
const PLAN = process.env.RAJAONGKIR_PLAN || 'starter';

const api = axios.create({
  baseURL: `${BASE_URL}/${PLAN}`,
  headers: { key: RAJAONGKIR_KEY }
});

// Cache untuk provinces & cities (jarang berubah)
let provincesCache: any[] | null = null;
let citiesCache: Map<string, any[]> = new Map();

export async function getProvinces() {
  if (provincesCache) return provincesCache;
  const { data } = await api.get('/province');
  provincesCache = data.rajaongkir.results;
  return provincesCache;
}

export async function getCities(provinceId: string) {
  if (citiesCache.has(provinceId)) return citiesCache.get(provinceId);
  const { data } = await api.get(`/city?province=${provinceId}`);
  const cities = data.rajaongkir.results;
  citiesCache.set(provinceId, cities);
  return cities;
}

export async function calculateCost(params: {
  origin: string;      // city ID asal
  destination: string; // city ID tujuan
  weight: number;      // gram
  courier: string;     // jne, tiki, pos, jnt, sicepat, dll
}) {
  const { data } = await api.post('/cost', params);
  return data.rajaongkir.results;
}

// Hanya tersedia di plan Pro
export async function trackWaybill(waybill: string, courier: string) {
  const { data } = await api.post('/waybill', { waybill, courier });
  return data.rajaongkir.result;
}
```

### 6. Buat API Routes

#### `GET /api/shipping/provinces`
```typescript
// Endpoint: GET /api/shipping/provinces
// Response: { provinces: [{ province_id, province }] }
// Cache: In-memory (data jarang berubah)
```

#### `GET /api/shipping/cities?province_id=X`
```typescript
// Endpoint: GET /api/shipping/cities?province_id=6
// Response: { cities: [{ city_id, city_name, type, postal_code }] }
// Cache: In-memory per province
```

#### `POST /api/shipping/cost`
```typescript
// Endpoint: POST /api/shipping/cost
// Body: { origin: "501", destination: "114", weight: 1000, courier: "jne" }
// Response: {
//   results: [{
//     code: "jne",
//     name: "Jalur Nugraha Ekakurir",
//     costs: [{
//       service: "REG",
//       description: "Layanan Reguler",
//       cost: [{ value: 18000, etd: "2-3", note: "" }]
//     }]
//   }]
// }
```

#### `POST /api/shipping/track` (plan Pro only)
```typescript
// Endpoint: POST /api/shipping/track
// Body: { waybill: "SOCAG00183235715", courier: "jne" }
// Response: { manifest: [...], delivery_status: {...} }
```

#### `GET/POST /api/shipping/addresses`
```typescript
// CRUD alamat pengiriman user
// GET: List alamat user
// POST: Tambah alamat baru
```

### 7. Update Mobile App

#### Checkout.tsx
```
Current:
- Pilih kurir dari dropdown (mock options)
- Harga ongkir kalkulasi sederhana

Target:
- User pilih alamat pengiriman (atau isi baru)
- Fetch city ID dari alamat supplier (origin) dan buyer (destination)
- Call POST /api/shipping/cost untuk semua kurir
- Tampilkan opsi kurir + harga real + estimasi waktu
- User pilih kurir → update ongkir di order
```

#### Profil.tsx / Register
```
Current:
- Input alamat text biasa

Target:
- Dropdown Provinsi → Kota (dari RajaOngkir API)
- Simpan cityId untuk kalkulasi ongkir
```

#### DetailPesanan.tsx
```
Current:
- Timeline tracking mock

Target:
- Input resi dari supplier
- Call /api/shipping/track untuk tracking real
- Update timeline dengan manifest dari kurir
```

### 8. Kurir Yang Didukung (per Plan)

| Plan | Kurir | Harga |
|------|-------|-------|
| **Starter** | JNE, TIKI, POS Indonesia | Gratis |
| **Basic** | + J&T, SiCepat, Anteraja, Wahana, Ninja, Lion Parcel, RPX, SAP | Rp 100rb/bln |
| **Pro** | + JNE YES/SPS, POS Kilat, DSE, ESL, dll + Tracking + Subdistrict | Rp 250rb/bln |

### 9. Flow Lengkap

```
Register / Update Profil
│
├── 1. Pilih Provinsi
│   └── GET /api/shipping/provinces
│       └── Tampilkan dropdown provinsi
│
├── 2. Pilih Kota
│   └── GET /api/shipping/cities?province_id=X
│       └── Tampilkan dropdown kota
│
└── 3. Simpan → ShippingAddress (cityId tersimpan)

Checkout Flow
│
├── 1. Pilih alamat pengiriman (atau city buyer)
│
├── 2. Hitung ongkir
│   └── POST /api/shipping/cost
│       ├── origin: supplier cityId
│       ├── destination: buyer cityId
│       ├── weight: total berat item (gram)
│       └── courier: "jne:tiki:pos" (multi-kurir)
│
├── 3. Tampilkan opsi
│   ├── JNE REG - Rp 18.000 (2-3 hari)
│   ├── JNE YES - Rp 36.000 (1 hari)
│   ├── TIKI REG - Rp 16.000 (3-4 hari)
│   └── POS Kilat - Rp 15.000 (3-5 hari)
│
├── 4. User pilih kurir
│   └── Update Order.courier & Order.shippingCost
│
└── 5. Lanjut ke pembayaran (Midtrans)

Tracking (setelah kirim)
│
├── 1. Supplier input resi
│   └── PATCH /api/orders/[id] { trackingNumber: "xxx" }
│
├── 2. Buyer cek tracking
│   └── POST /api/shipping/track
│       └── Tampilkan manifest perjalanan paket
│
└── 3. Buyer konfirmasi terima
    └── PATCH /api/orders/[id] { status: "SELESAI" }
```

### 10. Caching Strategy

```
Provinces → Cache permanen (jarang berubah)
Cities    → Cache per province (jarang berubah)
Cost      → Cache 1 jam (harga bisa berubah)
Tracking  → No cache (real-time)
```

### 11. Mapping Lokasi Existing → RajaOngkir City

Saat ini `ProductEntry.location` berisi nama lokasi text (e.g., "Malang", "Surabaya"). Perlu mapping ke RajaOngkir `city_id`:

```typescript
// Strategi mapping:
// 1. Saat user registrasi, simpan cityId di ShippingAddress
// 2. Untuk ProductEntry existing, match lokasi text ke city name
// 3. Fallback: geocoding → cari city terdekat
```

### 12. Testing Checklist

- [ ] API key RajaOngkir valid
- [ ] GET provinces returns data
- [ ] GET cities by province returns data
- [ ] POST cost calculation returns accurate pricing
- [ ] Multi-courier cost comparison works
- [ ] Mobile dropdown province → city works
- [ ] Checkout menampilkan ongkir real
- [ ] Order menyimpan kurir + ongkir yang dipilih
- [ ] Tracking resi (jika plan Pro)
- [ ] Error handling: API rate limit, invalid city

---

## Timeline

| Minggu | Sprint | Deliverable |
|--------|--------|-------------|
| 1 | Setup | Akun RajaOngkir + API key + library + model ShippingAddress |
| 1 | Backend | API provinces/cities/cost |
| 1-2 | Frontend | Update Register + Checkout di mobile app |
| 2 | Tracking | API tracking resi + update DetailPesanan |
| 2 | Testing | E2E testing + fix bugs |
