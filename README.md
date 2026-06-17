# PROPOSAL TRANSFORMASI DIGITAL: APLIKASI TUMBASNA
> **Tema:** UMKM Digital dan Rantai Pasok  
> **Sub-Tema:** Mendorong digitalisasi UMKM agar lebih efisien terhubung dengan pasar serta mampu mengelola proses bisnis dan rantai pasok secara lebih terintegrasi.

---

## 📌 Daftar Isi
1. [Latar Belakang & Analisis Masalah](#1-latar-belakang--analisis-masalah)
2. [Visi & Solusi: Aplikasi Tumbasna](#2-visi--solusi-aplikasi-tumbasna)
3. [Fitur Utama Platform](#3-fitur-utama-platform)
4. [Arsitektur Teknis & Alur Kerja Sistem](#4-arsitektur-teknis--alur-kerja-sistem)
5. [Diagram Alur Kerja (Workflow)](#5-diagram-alur-kerja-workflow)
6. [Roadmap Pengembangan](#6-roadmap-pengembangan)
7. [Dampak & Manfaat Proyek](#7-dampak--manfaat-proyek)
8. [Panduan Memulai (Instalasi & Pengujian)](#8-panduan-memulai-instalasi--pengujian)

---

## 1. Latar Belakang & Analisis Masalah

Usaha Mikro, Kecil, dan Menengah (UMKM) merupakan pilar utama perekonomian nasional. Namun, di era digitalisasi ini, sebagian besar UMKM masih menghadapi hambatan struktural dan operasional yang signifikan untuk berkembang secara optimal. 

Berdasarkan analisis kondisi riil di lapangan, terdapat **tiga fokus masalah utama** yang dihadapi oleh pelaku UMKM saat ini:

*   **Pemanfaatan Kanal Digital yang Belum Optimal:**  
    Banyak pelaku UMKM mengalami kesulitan mengadopsi aplikasi digital (dashboard/ERP) yang kompleks karena keterbatasan literasi teknologi. Hal ini menyebabkan proses pencatatan usaha dan pemanfaatan platform e-commerce konvensional masih minim.
*   **Ketidaknyamanan Manajemen Stok & Logistik yang Tidak Efisien:**  
    Proses pencatatan inventaris masih bersifat manual (buku fisik), memicu risiko kehabisan stok (*stockout*) atau penumpukan barang (*overstock*). Di sisi logistik, pengiriman barang belum terkoordinasi dengan baik, berujung pada tingginya ongkos kirim dan lambatnya pemenuhan pesanan.
*   **Terbatasnya Akses Pasar & Konektivitas Rantai Pasok (Supply Chain):**  
    UMKM kerap berdiri secara terisolasi tanpa hubungan langsung ke pemasok bahan baku utama (*first-tier suppliers*) maupun distributor logistik. Hal ini menyebabkan harga bahan baku menjadi mahal (karena melewati banyak tengkulak) dan jangkauan pasar yang sempit.

---

## 2. Visi & Solusi: Aplikasi Tumbasna

Aplikasi **Tumbasna** hadir sebagai hasil transformasi dan pengembangan lebih lanjut dari platform pencocokan pangan (sebelumnya bernama *Tumbasna*). Tumbasna dirombak menjadi sebuah **Ekosistem Digital UMKM & Manajemen Rantai Pasok Cerdas** yang dirancang khusus untuk mengatasi hambatan literasi digital melalui pendekatan **Conversational Commerce**.

### 🌟 Pendekatan Utama Tumbasna:
Dengan memanfaatkan **WhatsApp Webhook** yang terintegrasi dengan **Google Gemini AI**, pelaku UMKM tidak perlu mempelajari aplikasi baru yang rumit. Cukup dengan mengirimkan pesan teks biasa (seperti *"Stok kripik singkong masuk 50 bungkus"* atau *"Butuh pasokan gula pasir 100 kg dari supplier terdekat"*), sistem kecerdasan buatan akan memproses, mencatat, dan menghubungkannya secara otomatis ke dalam sistem rantai pasok terintegrasi.

---

## 3. Fitur Utama Platform

Untuk menyelesaikan tiga fokus masalah di atas, Tumbasna mengusung 4 pilar fitur utama:

### A. AI WhatsApp Bot (Asisten Operasional UMKM)
*   **Ekstraksi Pesan Natural:** Menggunakan LLM Google Gemini Pro untuk mendeteksi intensi (*intent*) pengguna dari pesan WhatsApp (pembelian, penjualan, pembaruan stok).
*   **Pencatatan Transaksi Tanpa Aplikasi:** Pelaku UMKM dapat memperbarui stok, mencatat penjualan harian, atau memesan bahan baku langsung dari ruang obrolan WhatsApp mereka.
*   **Notifikasi Pencocokan (Matchmaking Alert):** Memberikan notifikasi instan via WhatsApp apabila terdapat kecocokan antara kebutuhan stok UMKM dengan pasokan dari suplier terdekat.

### B. Manajemen Stok Cerdas (Smart Inventory Dashboard)
*   **Pemantauan Stok Real-Time:** Dashboard visual interaktif untuk memonitor ketersediaan barang di gudang UMKM.
*   **Prediksi Kebutuhan Bahan Baku:** Menganalisis histori penjualan untuk memberikan rekomendasi kapan waktu terbaik melakukan pemesanan ulang (*reorder point*).

### C. Hub Konektivitas Rantai Pasok (B2B Supply Chain Link)
*   **Direktori Produsen & Supplier Tangan Pertama:** Menghubungkan UMKM langsung ke produsen bahan baku lokal untuk mendapatkan harga kompetitif.
*   **Pencocokan Otomatis Permintaan-Pasokan:** Algoritma yang secara cerdas menjodohkan penawaran bahan baku murah dari suplier dengan permintaan UMKM di wilayah geografis terdekat menggunakan peta koordinat.

### D. Integrasi Logistik Terpadu (Smart Logistics)
*   **Peta Distribusi (Geocoding & Hotspots):** Pemanfaatan Leaflet Map dan Nominatim OpenStreetMap untuk memetakan lokasi UMKM, suplier, dan titik pengiriman barang.
*   **Konsolidasi Pengiriman (*Shared Logistics*):** Memungkinkan beberapa UMKM di wilayah yang sama untuk menggabungkan rute pengiriman guna meminimalkan biaya logistik harian.

---

## 4. Arsitektur Teknis & Alur Kerja Sistem

Tumbasna dibangun di atas fondasi teknologi yang tangguh, modular, dan siap untuk skala besar (*Production Ready*):

*   **Frontend & Dashboard:** `Next.js 14` (App Router) dengan styling modern menggunakan `Tailwind CSS` untuk visualisasi performa bisnis yang *premium* dan *responsive*.
*   **Database & ORM:** `PostgreSQL` diakses melalui `Prisma ORM` untuk menyimpan data transaksi, inventaris, status kemitraan, dan sesi chat.
*   **AI Engine (NLP):** `Google Gemini Pro API` diintegrasikan dalam backend untuk mengubah kalimat bebas (Unstructured Data) menjadi format data objek JSON terstruktur (Structured Data).
*   **WhatsApp Gateway:** Menggunakan pustaka `Baileys` (WhatsApp Multi-Device) atau REST Webhook Gateway pihak ketiga untuk komunikasi dua arah secara real-time.
*   **Sistem Pemetaan:** `React Leaflet` & `OpenStreetMap API` untuk pencarian rute pengiriman dan visualisasi klaster UMKM.

---

## 5. Diagram Alur Kerja (Workflow)

Berikut adalah visualisasi alur bagaimana pesan alami dari pelaku UMKM diproses oleh kecerdasan buatan hingga terintegrasi ke dalam ekosistem rantai pasok Tumbasna:

```mermaid
sequenceDiagram
    autonumber
    actor UMKM as Pelaku UMKM / Supplier
    participant WA as WhatsApp Gateway (Baileys)
    participant AI as Gemini AI Agent (LangChain)
    participant DB as Postgres (via Prisma)
    participant Dash as Next.js Dashboard

    UMKM->>WA: Kirim chat: "Beli tepung terigu 50kg ke supplier terdekat"
    WA->>AI: Meneruskan pesan mentah (Unstructured Text)
    Note over AI: AI menganalisis intent: DEMAND<br/>commodity: Tepung Terigu<br/>qty: 50 kg
    AI->>DB: Cari supplier aktif & simpan histori chat (ChatSession)
    DB-->>AI: Data Supplier & Histori dimuat
    AI-->>WA: Mengirim draft JSON & pesan konfirmasi ("Pesanan Tepung Terigu 50kg disiapkan")
    WA-->>UMKM: Kirim balasan WhatsApp otomatis
    
    Note over DB,Dash: Dashboard diperbarui secara Real-Time
    Dash->>DB: Monitor grafik stok & permintaan baru
```

---

## 6. Roadmap Pengembangan

Untuk mengimplementasikan perubahan ke aplikasi Tumbasna, proyek dibagi menjadi 4 fase strategis:

| Fase | Fokus Kegiatan | Output Utama |
| :--- | :--- | :--- |
| **Fase 1** | Migrasi Core & Pembaruan WhatsApp-AI | Rebranding repositori Tumbasna ke Tumbasna, optimasi prompt Gemini AI untuk kategori komoditas UMKM yang lebih luas. |
| **Fase 2** | Manajemen Stok & Katalog Online | Pembuatan modul inventaris berbasis WhatsApp dan fitur pembuatan halaman toko online (E-Catalog) instan bagi UMKM. |
| **Fase 3** | Integrasi Rantai Pasok B2B | Fitur matchmaking otomatis antara permintaan bahan baku UMKM dengan penawaran suplier menggunakan algoritma berbasis lokasi terdekat. |
| **Fase 4** | Agregator Logistik & Analytics | Kerjasama API logistik pihak ketiga untuk optimasi pengiriman dan rilis dashboard analitik bisnis bagi UMKM. |

---

## 7. Dampak & Manfaat Proyek

Transformasi aplikasi Tumbasna diproyeksikan memberikan dampak nyata pada ekosistem usaha mikro:

1.  **Efisiensi Operasional UMKM:** Mengurangi waktu pencatatan stok dan pemesanan logistik hingga **60%** melalui otomasi asisten WhatsApp.
2.  **Penurunan Biaya Produksi (HPP):** Konektivitas langsung ke suplier pertama memotong rantai distribusi tengah (tengkulak), menghemat biaya bahan baku sekitar **15% - 25%**.
3.  **Akses Pasar Lebih Luas:** Integrasi katalog digital mempermudah UMKM menjangkau pembeli baru di luar wilayah operasional tradisional mereka.
4.  **Skalabilitas Bisnis:** Dashboard berbasis data membantu UMKM mengambil keputusan berbasis fakta, bukan intuisi semata.

---

## 8. Panduan Memulai (Instalasi & Pengujian)

Aplikasi Tumbasna terdiri dari dua subsistem utama: `tumbasna-dashboard` (Dashboard monitoring & API database) dan `tumbasna-whatsapp` (Gateway chat & AI agent).

### A. Prasyarat Sistem
*   Node.js v18+ atau v20+
*   PostgreSQL / SQLite Database
*   Layanan Ngrok (untuk testing webhook WhatsApp di lokal)
*   API Key Google Gemini (didapatkan dari Google AI Studio)

### B. Langkah Instalasi Dashboard
1.  Masuk ke direktori dashboard:
    ```bash
    cd tumbasna-dashboard
    ```
2.  Instal seluruh dependensi:
    ```bash
    npm install
    ```
3.  Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5432/tumbasna_db"
    GEMINI_API_KEY="AIzaSyAXXXX_YOUR_GEMINI_KEY"
    ```
4.  Jalankan sinkronisasi database:
    ```bash
    npx prisma db push
    npx prisma generate
    ```
5.  Jalankan aplikasi Next.js dalam mode development:
    ```bash
    npm run dev
    ```

### C. Langkah Instalasi Bot WhatsApp
1.  Masuk ke direktori whatsapp:
    ```bash
    cd ../tumbasna-whatsapp
    ```
2.  Instal dependensi dan jalankan server bot:
    ```bash
    npm install
    npm run dev
    ```
3.  Pindai (*scan*) kode QR yang muncul pada konsol terminal menggunakan WhatsApp aplikasi Anda untuk menghubungkan bot.

---

*Tumbasna - Menghubungkan UMKM, Mempermudah Rantai Pasok, Mendorong Efisiensi Nasional.*
