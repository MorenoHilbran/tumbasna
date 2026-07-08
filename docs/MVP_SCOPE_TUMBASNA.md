# 🎯 Minimum Viable Product (MVP) - Tumbasna

## 1. Definisi MVP
MVP adalah versi aplikasi yang hanya berisikan **fitur-fitur fundamental paling wajib** agar sistem bisa digunakan untuk **bertransaksi** sungguhan oleh pengguna (Gapoktan dan UMKM), dengan membuang fitur tambahan (*nice-to-have*) ke fase pengembangan selanjutnya.

## 2. Batasan Scope MVP (In-Scope)
Berikut adalah daftar fitur yang **WAJIB SELESAI** untuk perilisan MVP:

### A. WhatsApp Asisten Petani
- [x] Bot bisa menerima pesan teks biasa.
- [x] AI Gemini mampu mendeteksi komoditas, jumlah, harga, dan lokasi dari teks petani.
- [x] Bot memasukkan data tersebut ke database (Tabel Supply/Product).
- [ ] Pengiriman notifikasi ke WhatsApp petani saat produknya dipesan.

### B. Mobile App (Untuk UMKM)
- [x] Katalog produk bahan baku (diambil dari data petani di WA).
- [ ] Fitur Checkout dengan pilihan Alamat Pengiriman.
- [ ] Kalkulasi Ongkos Kirim (*Integration RajaOngkir API*).
- [ ] Opsi Pembayaran QRIS/Virtual Account (*Integration Midtrans API*).
- [ ] Riwayat pesanan untuk melacak status (Menunggu, Dikirim, Selesai).

### C. Backend & Web Dashboard
- [x] Algoritma pencocokan jarak antara lokasi Petani dan lokasi UMKM pembeli.
- [x] Dashboard sederhana untuk Super Admin melihat daftar stok dan pesanan.
- [ ] Webhook Notifikasi Midtrans (update status order secara otomatis jika sudah dibayar).
- [ ] Keamanan API menggunakan token otentikasi dasar (JWT).

## 3. Di Luar Batasan MVP (Out-of-Scope / Fase 2)
Fitur-fitur di bawah ini **DITUNDA** pengembangannya setelah rilis MVP sukses:
- Chat real-time in-app antara Petani dan UMKM (sementara via WA/Telpon langsung).
- Analisis sentimen harga dan inflasi *predictive* di dashboard (cukup data historis biasa dulu).
- Sistem Manajemen Logistik Backhaul (konsolidasi kurir muatan balik).
- E-Catalog web interaktif untuk petani jualan langsung ke *end-user* rumah tangga.
- Rating & Review (saat ini bintang statis / disembunyikan sementara).

## 4. Metrik Keberhasilan MVP
Tumbasna MVP dianggap sukses apabila:
1. Terjadi setidaknya **10 Transaksi Nyata** dari UMKM ke Petani dengan pembayaran yang divalidasi Midtrans.
2. Bot WhatsApp merespons *chat* petani dan mengekstrak data JSON tanpa kegagalan (Akurasi NLP > 85%).
3. Kalkulasi ongkos kirim dan jarak pengantaran tidak keliru sehingga tidak merugikan kurir lokal.
