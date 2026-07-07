# 🧪 Dokumen Skenario Pengujian MVP (Tumbasna)

**Dokumen UAT (User Acceptance Testing) - End-to-End**
*Disusun oleh: Project Manager*

Dokumen ini memuat langkah-langkah pengujian *End-to-End* (E2E) untuk memastikan seluruh sistem utama Tumbasna (WhatsApp Bot, Mobile App, Backend/Matching, dan Dashboard Admin) terintegrasi dan berfungsi dengan baik.

## 📋 Alur Skenario Uji Coba (Test Flow)

Skenario pengujian yang Anda usulkan sudah **sangat tepat dan komprehensif** karena mewakili seluruh *lifecycle* pengguna (dari *onboarding* pasokan, transaksi, hingga evaluasi akhir). 

Namun, agar alurnya lebih natural sesuai *user journey* di dunia nyata, tahap **Negosiasi (Chat)** umumnya diletakkan *sebelum* Checkout (karena harga atau ongkos biasanya disepakati sebelum transaksi dikunci di Midtrans).

Berikut adalah urutan pengujian yang telah disempurnakan:

### Tahap 1: Setup & Koneksi
- [ ] **Start Services:** Pastikan `tumbasna-dashboard` (Next.js backend), `tumbasna-mobile` (Frontend Vite/Ionic), dan `tumbasna-whatsapp` (Node.js Bot) berjalan tanpa *error* di terminal.
- [ ] **Koneksi Bot WA:** *Scan* QR Code Tumbasna WA Bot. Pastikan terminal menunjukkan status *Connected/Ready*.

### Tahap 2: Onboarding & Input Data (Sisi Supplier)
- [ ] **Registrasi Supplier:** Kirim pesan sapaan (contoh: "Halo" atau ikuti instruksi bot) ke Bot WA Tumbasna dari nomor tes. Pastikan bot mendaftarkan nomor telepon tersebut sebagai *User* baru.
- [ ] **Input Produk:** Ikuti panduan chat bot WA untuk menambahkan komoditas (misal: "Jual 100 kg Bawang Merah harga Rp 25.000/kg").
- [ ] **Validasi Database:** Cek apakah produk tersebut sukses ter-input ke dalam tabel `ProductEntry` di database.

### Tahap 3: Discovery & Matching (Sisi Buyer)
- [ ] **Akses Mobile App:** Buka aplikasi Tumbasna Mobile menggunakan akun pembeli (Buyer).
- [ ] **Cek Katalog (Pasar):** Buka halaman "Pasar". Pastikan komoditas yang baru saja diinput oleh Supplier (melalui WA) muncul di etalase aplikasi dengan data yang akurat (harga, jumlah, dll).
- [ ] **Uji Sistem Matching:** Input profil permintaan beli (*Demand*). Pastikan sistem (algoritma *matching*) berhasil mendeteksi suplai dari Supplier tersebut sebagai rekomendasi cerdas.

### Tahap 4: Komunikasi & Negosiasi
- [ ] **Akses Fitur Chat:** Buka menu pesan / negosiasi pada aplikasi.
- [ ] **Simulasi Negosiasi:** Lakukan percakapan simulasi antara Buyer (via App) dengan Supplier. Pastikan pesan tersampaikan dengan baik dan kedua pihak bisa menyesuaikan harga/ongkos kirim jika diperlukan.

### Tahap 5: Checkout & Pembayaran
- [ ] **Checkout Pesanan:** Buyer memasukkan produk ke keranjang dan menekan *Checkout*.
- [ ] **Pilih Kurir (Opsi Logistik):** 
  - Pilih **Kurir Lokal** -> Pastikan ongkos kirim tampil `Rp 0` (Dinegosiasikan).
  - Pilih **Ekspedisi** -> Pastikan harga RajaOngkir / Fallback tampil dengan benar.
- [ ] **Pembayaran QRIS:** Tekan "Bayar". Pastikan *popup* Snap Midtrans terbuka.
- [ ] **Konfirmasi Webhook:** Selesaikan pembayaran di simulator Midtrans. Pastikan pesanan otomatis berubah status dari `MENUNGGU_PEMBAYARAN` menjadi `DIPROSES`.
- [ ] **Notifikasi Transaksi ke WA:** Pastikan Supplier menerima pesan otomatis dari Bot WA Tumbasna ("Ada pesanan masuk & sudah dibayar").

### Tahap 6: Pemantauan Pesanan (Tracking)
- [ ] **Cek Status di Mobile:** Buka menu "Pesanan" di aplikasi pembeli, pastikan status pemesanan ter-update (Misal: dari Diproses -> Dikirim -> Selesai).

### Tahap 7: Validasi Dashboard Admin
- [ ] **Akses Dashboard Tumbasna Web:** Buka panel Admin via browser.
- [ ] **Cek Integritas Data Transaksi:** Buka menu Transaksi, pastikan pesanan yang baru saja dilakukan tercatat lengkap (ID TRX, status `Selesai`, nilai transaksi).
- [ ] **Cek Laporan (Analytics):** Pastikan grafik atau *summary* nominal transaksi ikut bertambah dan terintegrasi dengan baik.

---

## 🛠 Catatan Evaluasi Pengujian & Bug Report
*(Gunakan area ini untuk mencatat kendala atau bug yang ditemukan selama proses pengujian)*

1. [ ] Bug 1: __________________
2. [ ] Bug 2: __________________
3. [ ] Bug 3: __________________
