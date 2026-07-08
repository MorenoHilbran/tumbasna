# ⚙️ Technical Requirements Document (TRD) - Tumbasna

## 1. Arsitektur Sistem & Tech Stack
Ekosistem Tumbasna dipecah menjadi beberapa *service* dengan arsitektur **Monorepo**:

- **Backend API & Web Dashboard:** `Next.js 16` (App Router), React 19.
- **WhatsApp Gateway:** `Node.js`, Pustaka `Baileys` (Koneksi WA Web), `LangChain` (LLM Orchestration).
- **Mobile App:** `Ionic React`, `Capacitor` (untuk build APK/iOS), `Vite`.
- **Database:** `PostgreSQL` (di-host pada Supabase).
- **ORM:** `Prisma ORM` v5.

## 2. Integrasi Pihak Ketiga (Third-Party Services)
- **Kecerdasan Buatan (NLP):** Google Gemini Pro API (Ekstraksi teks tidak terstruktur menjadi JSON berstruktur).
- **Payment Gateway:** Midtrans (Menangani pembuatan pembayaran Snap/QRIS, Webhook notifikasi).
- **Logistik (Kurir):** RajaOngkir API (Mendapatkan provinsi, kota, dan kalkulasi ongkos kirim real-time).
- **Geocoding & Maps:** Nominatim OpenStreetMap (Ubah alamat jadi koordinat GPS) dan Leaflet (Visualisasi rute).

## 3. Database Schema (Prisma Data Model)
Model utama yang digunakan:
1. `User` (Peran: PETANI, PEDAGANG, ADMIN)
2. `ProductEntry` (Barang mentah hasil ekstraksi WA)
3. `Match` (Kecocokan antara permintaan UMKM dan ketersediaan Gapoktan)
4. `Order` & `OrderItem` (Pesanan yang sudah dibayar dan dalam proses)
5. `Payment` (Mencatat status dari Midtrans)
6. `ShippingAddress` (Mencatat alamat untuk perhitungan RajaOngkir)
7. `ChatSession` & `ChatMessage` (Riwayat percakapan AI dengan pengguna)

## 4. Algoritma Inti: Smart Matching Engine
Mesin pencocok ini (SME) bertugas menghubungkan Supplier dan Buyer secara otomatis.
- **Filter Geografis:** Menggunakan rumus matematika *Haversine Formula* untuk menghitung jarak lurus (Bumi) berdasarkan latitude dan longitude. Toleransi maksimal: radius 100 KM.
- **Filter Harga:** Harga penawaran tidak boleh melebihi margin 15% dari harga permintaan.
- **Sistem Bobot (Scoring):** Hasil pencocokan akan diurutkan berdasarkan skor gabungan (Jarak 70% + Harga 30%).

## 5. Security & Authentication
- **User Auth:** Berbasis token JWT (JSON Web Tokens) untuk API perlindungan.
- **Webhook Security:** Validasi *Signature/Hash* dari Midtrans saat menerima *callback* agar tidak dipalsukan.
- **Infrastructure:** Variabel sensitif (API Key) disimpan aman di file `.env` dan tidak diunggah ke *Version Control* (Git).

## 6. Deployment Topology (VPS)
- **Containerization:** Menggunakan Docker & Docker Compose.
- **Reverse Proxy:** Nginx untuk mengarahkan domain `api.tumbasna.com` (ke port 3000 Next.js) dan mengekspos HTTPS (SSL Let's Encrypt).
- **Mobile Build:** File statis HTML/JS dari Ionic yang diletakkan pada Nginx (atau dibuild menjadi APK via Android Studio).
