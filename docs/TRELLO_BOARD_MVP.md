# 📌 Trello Board Tumbasna - Detail Planning Juli 2026 (Sync Codebase Terbaru)
> **Hari Ini:** Sabtu, 11 Juli 2026 (Akhir Sprint 1)  
> **Deadline Rilis MVP:** 25 Juli 2026  
> **Hari Tersisa:** ~14 hari kerja (12 Juli - 25 Juli)  
> **Status Integrasi:** 🚀 Tim telah melakukan push kode besar untuk integrasi **Midtrans (QRIS API)**, **RajaOngkir (Shipping API)**, dan update halaman mobile app (`Checkout.tsx`, `PembayaranQris.tsx`). 

---

## 🟢 DONE (Telah Selesai)

### 1. [PAY-01] Integrasi Midtrans Core API (QRIS Only)
*   **Tanggal Selesai:** 11 Juli 2026  
*   **Implementasi:**
    - [x] Endpoint `POST /api/payments/create` (`tumbasna-dashboard/src/app/api/payments/create/route.ts`) menembak Core API `/v2/charge` Midtrans untuk mendapatkan `qr_string` dinamis.
    - [x] Kolom `snapToken` di reuse untuk menampung string QRIS tanpa perlu migrasi DB.
    - [x] Endpoint Webhook `POST /api/payments/notification` (`tumbasna-dashboard/src/app/api/payments/notification/route.ts`) memproses callback Midtrans dan mengupdate status order menjadi `DIPROSES` saat settlement.
    - [x] Halaman `PembayaranQris.tsx` di mobile app merender QRIS asli dari response API (`QRCodeSVG`).
    - [x] Polling otomatis status pembayaran (`/api/payments/status`) dipasang di mobile client setiap 5 detik.
    - [x] Push notifikasi WA otomatis ke supplier melalui bot ketika pembayaran diselesaikan (`/api/send`).

### 2. [LOG-01] Integrasi RajaOngkir (Shipping Cost Calculation)
*   **Tanggal Selesai:** 11 Juli 2026  
*   **Implementasi:**
    - [x] Endpoint `POST /api/shipping/cost` (`tumbasna-dashboard/src/app/api/shipping/cost/route.ts`) terhubung ke RajaOngkir API `/cost` menggunakan `origin` (petani) dan `destination` (buyer).
    - [x] Mapping lokal nama kota ke ID Kota Starter RajaOngkir dibuat di `Checkout.tsx` (`CITY_ID_MAP`).
    - [x] Form input Checkout di mobile app mengkalkulasi tarif dinamis ekspedisi RajaOngkir ketika memilih opsi "Ekspedisi Logistik Kilat".

### 3. [DB-01] Pembersihan Dashboard UI & Saldo Page
*   **Tanggal Selesai:** 11 Juli 2026  
*   **Implementasi:**
    - [x] Endpoint `/api/dashboard/stats` dan `/api/dashboard/saldo` dibuat untuk menarik data riwayat dan performa rill database.
    - [x] Layout dashboard saldo (`tumbasna-dashboard/src/app/dashboard/saldo/page.tsx`) terhubung untuk memonitor dana held/released (escrow).
    - [x] Visualisasi peta GIS di `LogistikMapLeaflet.tsx` dan halaman transaksi terhubung dengan data asli prisma.

---

## 🟡 DOING (Sprint 2: 12 - 18 Juli)

### 1. [SEC-01] Implementasi JWT & Keamanan Route Dashboard (Kritis)
*   **Deskripsi:** Melindungi Dashboard Admin (halaman `/dashboard/*` & API `/api/dashboard/*`) dan API Mobile `/api/*` dari akses publik tidak berizin. Login saat ini masih bypass tanpa password.
*   **Tanggal Mulai:** 12 Juli 2026 | **Due Date:** 15 Juli 2026
*   **Anggota Tim:** Security / Backend Developer
*   **Checklist:**
    - [ ] Install library `bcryptjs`, `jsonwebtoken` dan `@types/jsonwebtoken` pada `tumbasna-dashboard`.
    - [ ] Update `prisma/schema.prisma` untuk menambahkan kolom `password` pada model `User` lalu push skema.
    - [ ] Perbarui `tumbasna-dashboard/src/app/api/auth/login/route.ts` agar memvalidasi password menggunakan `bcrypt.compare()` dan mengembalikan `token` JWT jika sukses.
    - [ ] Buat file `tumbasna-dashboard/src/middleware.ts` (Next.js Edge Middleware) untuk memverifikasi token JWT pada cookie/headers.
    - [ ] Proteksi halaman web `/dashboard/*` & API `/api/dashboard/*` agar redirect ke `/login` jika tidak ada token JWT valid.
    - [ ] Update header authorization (`Authorization: Bearer <token>`) di request axios/fetch pada mobile app (`AppContext.tsx`).

### 2. [WA-02] Uji Coba Lanjutan Bot WhatsApp & Integrasi Webhook
*   **Deskripsi:** Memastikan nomor WhatsApp Bot menyala di VPS (`202.155.13.225:3002`) dan dapat menangani interaksi rill dengan lancar.
*   **Tanggal Mulai:** 12 Juli 2026 | **Due Date:** 18 Juli 2026
*   **Anggota Tim:** Backend / WA Developer
*   **Checklist:**
    - [ ] Uji respon registrasi otomatis petani melalui pesan teks natural WhatsApp.
    - [ ] Uji notifikasi otomatis dari webhook Midtrans ke WA petani (`KIRIM <orderId> <resi>`) ketika pembayaran diselesaikan buyer.
    - [ ] Verifikasi command WA `KIRIM` dari petani mengubah status order di database menjadi `DIKIRIM` (dikerjakan di `messageHandler.ts`).
    - [ ] Pantau performa memory leak pada module Baileys di VPS RAM 2GB.

---

## 🔴 TO DO (Sprint 3: 19 - 24 Juli)

### 1. [QA-01] Simulasi Sandbox End-to-End & UAT Bug Bash
*   **Deskripsi:** Menguji seluruh alur transaksi menggunakan parameter nyata di mode sandbox untuk mendeteksi kejanggalan sistem sebelum launching.
*   **Tanggal Mulai:** 19 Juli 2026 | **Due Date:** 22 Juli 2026
*   **Anggota Tim:** Seluruh Tim & Tester
*   **Checklist:**
    - [ ] Simulasikan Petani mendaftarkan panen via WhatsApp (misal: *"Jual beras cianjur 100kg harga 13000"*).
    - [ ] Pastikan matching engine memicu pencocokan dan data ter-update di database Supabase.
    - [ ] Buka Aplikasi Mobile ➡️ Add to Cart ➡️ Checkout (Gunakan map picker & ambil ongkir RajaOngkir).
    - [ ] Lakukan pembayaran dengan QRIS simulator Midtrans ➡️ Pantau status pembayaran di Mobile App (polling) berubah otomatis ke "Diproses".
    - [ ] Cek Dashboard Admin ➡️ Pastikan transaksi masuk ke grafik penjualan dan status escrow tertulis "Held (Ditahan)".
    - [ ] Selesaikan siklus dengan konfirmasi pengiriman via WA petani (`KIRIM`) ➡️ Klik "Konfirmasi Barang Diterima" di Mobile Buyer ➡️ Pastikan status dana berubah menjadi "Released (Dicairkan)" di Dashboard Saldo.

### 2. [DEVOPS-01] Persiapan Production Release (Go-Live)
*   **Deskripsi:** Migrasi server dari sandbox ke mode produksi nyata dan penataan domain.
*   **Tanggal Mulai:** 23 Juli 2026 | **Due Date:** 25 Juli 2026
*   **Anggota Tim:** DevOps
*   **Checklist:**
    - [ ] Daftarkan nama domain `tumbasna.com` (Subdomain `api.tumbasna.com` & `dashboard.tumbasna.com`).
    - [ ] Konfigurasikan SSL Let's Encrypt menggunakan Certbot di Nginx VPS.
    - [ ] Pindahkan credential Midtrans dan RajaOngkir di `.env` VPS dari mode Sandbox ke akun Production berbayar.
    - [ ] Jalankan build production final di VPS Docker container: `docker compose down && docker compose up -d --build`.
    - [ ] **25 JULI 2026: LAUNCHING PRODUCTION MVP GO-LIVE!** 🚀
