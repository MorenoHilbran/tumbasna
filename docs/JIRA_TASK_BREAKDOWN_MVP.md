# 📋 Tumbasna - Jira Task Breakdown & Project Plan (MVP)

> **Dokumen:** Rencana Kerja & Tracking Jira (Fase MVP)
> **Target Rilis MVP:** 25 Juli 2026
> **Project Manager:** AI Assistant
> **Fokus Utama:** Menyelesaikan fitur *Partially Implemented* dan memblokir fitur MVP agar siap rilis.

---

## 📅 Timeline Sprints (Target: 25 Juli 2026)

Mengingat waktu yang tersisa kurang lebih 3 minggu (4 Juli - 25 Juli), kita akan membagi pengembangan ke dalam 3 Sprint prioritas:

*   **Sprint 1 (4 - 11 Juli):** Aktivasi WA Gateway, Cleanup Data Mock, & Keamanan (JWT Auth).
*   **Sprint 2 (12 - 18 Juli):** Integrasi Payment Gateway (Midtrans) & Sistem Escrow.
*   **Sprint 3 (19 - 25 Juli):** Integrasi Ekspedisi (RajaOngkir) & End-to-End Testing.

---

## 🗂️ JIRA BOARD: Tumbasna MVP Release

Berikut adalah struktur board Jira (Kanban/Scrum) berdasarkan kondisi *codebase* Tumbasna saat ini.

### ✅ DONE (Sudah Selesai - Tidak Perlu Diestimasi Lagi)
*Fitur fundamental yang sudah dikembangkan di Phase 1.*

*   **[TUMB-01]** Setup Arsitektur Monorepo (Next.js, Node.js WA, Ionic Mobile).
*   **[TUMB-02]** Desain & Implementasi Database Schema (Prisma PostgreSQL - 7 Model Utama).
*   **[TUMB-03]** Pengembangan REST API Core (Supply, Demand, Product Entries).
*   **[TUMB-04]** Algoritma Smart Matching Engine (Jarak Haversine & Toleransi Harga).
*   **[TUMB-05]** Pembuatan UI Dashboard Admin (7 Halaman Analytics).
*   **[TUMB-06]** Pembuatan UI Mobile App Marketplace (12 Halaman).
*   **[TUMB-07]** Sistem NLP Ekstraksi Pesan WhatsApp via Gemini AI.

---

### ⏳ IN PROGRESS (Sedang Dikerjakan - Fokus Sprint 1)
*Tugas kritis yang kodenya sudah ada namun belum operasional atau masih menggunakan data palsu (mock).*

*   **[TUMB-08] [Epic: WA Gateway] Konfigurasi & Aktivasi WhatsApp Bot**
    *   *Task:* Daftarkan & pasang API Key aktif (Gemini/OpenAI) di `.env` (tumbasna-whatsapp).
    *   *Task:* Set `ENABLE_REAL_WA=true` dan scan QR Baileys di server.
    *   *Task:* Uji coba alur Chat -> Ekstraksi AI -> Database secara *real-time*.
*   **[TUMB-09] [Epic: Database & API] Penghapusan Mock Data Dashboard**
    *   *Task:* Hubungkan halaman Dashboard KPI dengan query `Prisma` asli.
    *   *Task:* Ganti data *hardcoded* di halaman Transaksi menjadi data relasi `Match` dan `Order`.
*   **[TUMB-10] [Epic: Security] Implementasi Authentication JWT**
    *   *Task:* Buat *middleware* proteksi API berbasis token JWT (saat ini masih basic phone login).

---

### 📝 TO DO (Akan Dikerjakan - Sprint 2 & 3)
*Fitur prioritas MVP yang sama sekali belum diimplementasi di codebase.*

#### Prioritas Tinggi (Wajib Selesai Sebelum 25 Juli)

*   **[TUMB-11] [Epic: Payment] Integrasi Midtrans Payment Gateway**
    *   *Task:* Buat model `Payment` dan enum `payment_status` di Prisma Schema.
    *   *Task:* Buat API Endpoint `/api/payments/create` untuk generate Snap Token.
    *   *Task:* Buat API Endpoint Webhook `/api/payments/notification` untuk callback status pembayaran.
    *   *Task:* Integrasikan Midtrans Snap ke halaman Checkout Mobile App (gantikan simulasi QRIS).
*   **[TUMB-12] [Epic: Ekspedisi] Integrasi API RajaOngkir**
    *   *Task:* Buat model `ShippingAddress` di Prisma Schema.
    *   *Task:* Buat API perhitungan ongkos kirim `/api/shipping/cost` (origin, destination, weight).
    *   *Task:* Update alur Checkout di Mobile App agar menggunakan API RajaOngkir (menggantikan Biteship parsial).
*   **[TUMB-13] [Epic: Logistik & Escrow] Sistem Penahanan Dana (Escrow) Sederhana**
    *   *Task:* Buat logika penahanan dana pembayaran di sistem sebelum Order berstatus "SELESAI".

#### Prioritas Menengah (Dikerjakan Jika Waktu Memungkinkan)

*   **[TUMB-14] [Epic: Komunikasi] Real-time Chat Sinkronisasi**
    *   *Task:* Migrasi penyimpanan chat dari `localStorage` Mobile ke API/Database (`ChatMessage`).
    *   *Task:* (Opsional MVP) Implementasi Polling/WebSocket untuk chat antar Buyer-Supplier.
*   **[TUMB-15] [Epic: QA] End-to-End Testing (UAT)**
    *   *Task:* Simulasi transaksi penuh: Order di Mobile -> Bayar Midtrans -> Status Update WA Bot -> Cek Resi RajaOngkir.

---

## 📊 Rangkuman Breakdown Tracking Jira

Untuk setup di Jira, Anda dapat menggunakan struktur **Epics** dan **Stories** berikut:

| Jira Tipe | Kunci | Ringkasan Task / Story | Status Board | Assignee | Sprint Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Epic** | **WA-01** | **Aktivasi WhatsApp Gateway Engine** | In Progress | Backend Dev | Sprint 1 |
| Task | WA-01.1 | Setup API Key AI & Fonnte Token | In Progress | Backend Dev | Sprint 1 |
| Task | WA-01.2 | E2E Test Chat Bot AI ke Database | To Do | QA | Sprint 1 |
| **Epic** | **DB-01** | **Database Cleanup & Security** | In Progress | Backend Dev | Sprint 1 |
| Task | DB-01.1 | Replace Mock Data di Dashboard KPI | To Do | Frontend Dev | Sprint 1 |
| Task | DB-01.2 | Implementasi JWT Middleware Auth | To Do | Backend Dev | Sprint 1 |
| **Epic** | **PAY-01** | **Midtrans Integration (MVP)** | To Do | Fullstack Dev | Sprint 2 |
| Story | PAY-01.1 | Sebagai pembeli, saya ingin membayar via QRIS/VA agar instan. | To Do | Frontend Dev | Sprint 2 |
| Task | PAY-01.2 | Setup Endpoint Snap & Webhook Callback | To Do | Backend Dev | Sprint 2 |
| **Epic** | **LOG-01** | **RajaOngkir Integration (MVP)** | To Do | Fullstack Dev | Sprint 3 |
| Task | LOG-01.1 | Prisma Migration untuk Shipping Address | To Do | Backend Dev | Sprint 3 |
| Story | LOG-01.2 | Sebagai pembeli, saya bisa melihat ongkir asli dari JNE/J&T/dll. | To Do | Frontend Dev | Sprint 3 |

---
**Catatan Project Manager:** 
Fokus utama hingga akhir Juli adalah **transaksi riil**. Fitur percantik UI, analitik lanjutan, dan backhaul logistik ditangguhkan ke fase pasca-MVP (Agustus ke atas). Pastikan semua tim fokus pada penyelesaian Midtrans dan RajaOngkir.
