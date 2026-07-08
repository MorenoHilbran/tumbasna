# Panduan Lengkap Setup Domain & Subdomain ke VPS Tumbasna

Panduan ini telah diperbarui untuk mengakomodasi penggunaan **Domain Utama** (`tumbasna.my.id`) sekaligus **Subdomain** (`dashboard.tumbasna.my.id` & `api.tumbasna.my.id`). Semua alamat ini akan diarahkan ke Port 3000 (Aplikasi Next.js Anda) dan diberi gembok hijau HTTPS.

## Tahap 1: Konfigurasi DNS di Rumahweb

Pastikan Anda sudah membuat **4 Record** ini di DNS Management Rumahweb:

| Domain/Host | Record Type | IP Address / Value | Keterangan |
| :--- | :--- | :--- | :--- |
| `@` (kosong) | **A** | `202.155.13.225` | Domain Utama |
| `www` | **A** | `202.155.13.225` | WWW Domain |
| `dashboard` | **A** | `202.155.13.225` | Subdomain Dashboard |
| `api` | **A** | `202.155.13.225` | Subdomain API |
| `mobile` | **A** | `202.155.13.225` | Subdomain Mobile Web |

*(Simpan semua dan tunggu beberapa menit agar tersambung).*

---

## Tahap 2: Install Nginx di VPS

1. Buka terminal SSH VPS Anda (`moreno@202.155.13.225`).
2. Update sistem dan install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```
3. Izinkan koneksi di Firewall VPS:
   ```bash
   sudo ufw allow 'Nginx Full'
   ```

---

## Tahap 3: Konfigurasi Nginx (Menerima Semua Domain & Subdomain)

Kita akan mengatur agar Nginx meneruskan kunjungan dari domain utama maupun subdomain ke aplikasi Next.js di Port 3000.

1. Buat file pengaturan Nginx baru:
   ```bash
   sudo nano /etc/nginx/sites-available/tumbasna
   ```

2. **Copy dan Paste** kode di bawah ini ke dalam editor terminal Anda:

   ```nginx
   server {
       listen 80;
       
       # Nginx akan menangkap alamat Landing Page, Dashboard, dan API:
       server_name tumbasna.my.id www.tumbasna.my.id dashboard.tumbasna.my.id api.tumbasna.my.id;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Konfigurasi khusus untuk Web App Mobile (Port 3001)
   server {
       listen 80;
       server_name mobile.tumbasna.my.id;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Simpan file tersebut dengan menekan:
   - **`Ctrl` + `X`**
   - **`Y`**
   - **`Enter`**

4. Aktifkan konfigurasi yang baru dibuat:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tumbasna /etc/nginx/sites-enabled/
   ```

5. Cek penulisan Nginx apakah sudah benar:
   ```bash
   sudo nginx -t
   ```
   *(Pastikan muncul **syntax is ok** dan **test is successful**)*.

6. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

---

## Tahap 4: Mengamankan Website dengan SSL (HTTPS)

Sekarang kita pasang gembok hijau untuk semua domain dan subdomain Anda sekaligus!

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. Hasilkan sertifikat SSL untuk **SEMUA** alamat Anda sekaligus. Jalankan perintah ini:
   ```bash
   sudo certbot --nginx -d tumbasna.my.id -d www.tumbasna.my.id -d dashboard.tumbasna.my.id -d api.tumbasna.my.id -d mobile.tumbasna.my.id
   ```

3. Saat proses berjalan:
   - Masukkan alamat Email Anda.
   - Ketik `Y` untuk setuju dengan persyaratan.
   - Pilih `Y` atau `N` untuk langganan email berita (bebas).

Selesai! Sekarang `https://tumbasna.my.id`, `https://dashboard.tumbasna.my.id`, dan `https://api.tumbasna.my.id` sudah aktif dan mengarah ke aplikasi Anda dengan aman!

---

## Tahap Tambahan: Aplikasi Mobile Tumbasna

Karena API Tumbasna sudah memiliki HTTPS dan subdomain khusus, silakan buka kode aplikasi mobile Anda (`tumbasna-mobile`) dan ubah **Base URL API**-nya.

Ubah dari: `http://202.155.13.225:3000/api`
Menjadi: `https://api.tumbasna.my.id/api`

Selamat! Sistem Tumbasna Anda sekarang sudah sangat profesional layaknya aplikasi perusahaan besar. 🚀
