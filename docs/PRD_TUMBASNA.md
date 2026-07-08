# 📄 Product Requirements Document (PRD) - Tumbasna

## 1. Ringkasan Eksekutif (Executive Summary)
**Tumbasna** adalah platform ekosistem digital dan manajemen rantai pasok cerdas (*Smart Supply Chain Management*) yang menjembatani petani dan produsen langsung ke tangan UMKM. Platform ini memanfaatkan pendekatan *Conversational Commerce* berbasis Kecerdasan Buatan (AI) via WhatsApp untuk mendobrak hambatan literasi digital pada masyarakat akar rumput.

## 2. Visi & Tujuan Produk
- **Visi:** Menjadi tulang punggung (*backbone*) digitalisasi rantai pasok komoditas pangan di Indonesia yang efisien, transparan, dan inklusif.
- **Tujuan:** 
  1. Memangkas jalur distribusi tengkulak yang terlalu panjang.
  2. Mencegah *food waste* akibat overstock pada tingkat petani.
  3. Memudahkan UMKM mendapatkan bahan baku dengan harga paling efisien.

## 3. Target Pengguna (User Personas)
Produk ini dirancang khusus untuk dua pilar utama:

### A. Sisi Penjual (Supplier / Maker)
*   **Target:** Gapoktan (Gabungan Kelompok Tani), Pengepul Lokal, Petani Daerah, dan Produsen Bahan Baku.
*   **Karakteristik & Masalah:** Memiliki literasi digital menengah ke bawah. Jarang menggunakan aplikasi kompleks, namun terbiasa menggunakan WhatsApp. Kesulitan mencari pasar langsung dan kerap dipermainkan harga oleh tengkulak.
*   **Solusi Tumbasna:** Asisten Bot WhatsApp AI (Tumbasna Bot). Petani cukup *chat* dengan bahasa sehari-hari (contoh: "Ada panen cabai 50kg nih") dan sistem akan otomatis mencatatnya sebagai stok (*Supply*) di database pusat.

### B. Sisi Pembeli (Buyer)
*   **Target:** Pelaku UMKM (Pemilik Warung Makan, Katering, Produsen Makanan Ringan, dsb).
*   **Karakteristik & Masalah:** Butuh kepastian ketersediaan bahan baku harian dengan ongkos kirim paling murah dan harga yang bersahabat.
*   **Solusi Tumbasna:** Aplikasi Mobile Tumbasna (Marketplace) dan/atau interaksi WhatsApp untuk mencari bahan baku, mengecek disparitas harga, dan melakukan pemesanan (Order) yang terhubung ke logistik lokal (RajaOngkir).

## 4. Fitur Utama (Key Features)
1. **AI WhatsApp NLP Engine:** Kemampuan mengekstrak *intent* (Supply/Demand), jenis komoditas, jumlah, dan harga dari teks chat biasa.
2. **Smart Matching Engine (SME):** Algoritma penjodohan otomatis berdasarkan jarak terdekat (radius <=100km via Haversine) dan toleransi harga.
3. **Smart Inventory Dashboard (Web):** Halaman pemantauan (Dashboard) untuk admin memonitor transaksi, tren harga pasar, dan peta sebaran logistik.
4. **Mobile Marketplace App:** Aplikasi untuk UMKM melakukan *browsing* produk, masuk keranjang, checkout (Midtrans), dan *tracking* pesanan.
5. **Sistem Rekening Bersama (Escrow):** Penahanan dana pembayaran hingga barang diterima pembeli untuk menjamin keamanan transaksi (Trust).

## 5. User Journey Singkat
- **Petani:** Chat WA ke Bot -> AI mencatat "Barang Tersedia".
- **UMKM (Pembeli):** Buka Aplikasi Mobile -> Cari "Bawang Merah" -> Lihat daftar dari petani terdekat -> Checkout.
- **Sistem:** Melakukan notifikasi ke Petani via WA -> Petani kirim barang -> Pembeli klik "Selesai" -> Dana cair ke Petani.
