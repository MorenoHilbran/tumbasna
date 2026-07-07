# 🚀 Panduan Deploy Tumbasna Ekosistem ke VPS (Production / Staging)

Dokumen ini memandu Anda langkah demi langkah untuk men-deploy ekosistem Tumbasna (Dashboard API, WhatsApp Bot, dan Mobile Web App) ke sebuah VPS agar dapat diakses oleh tim Anda secara publik tanpa harus menjalankan aplikasi di lokal masing-masing.

---

## 1. Persiapan Kebutuhan Server

Sebelum mulai, pastikan Anda telah menyiapkan hal-hal berikut:
1. **VPS (Virtual Private Server):** Disarankan menggunakan sistem operasi **Ubuntu 22.04 LTS** atau versi lebih baru. (Bisa menggunakan DigitalOcean, AWS EC2, Niagahoster, atau provider lain). Spesifikasi minimal: RAM 2GB, 2vCPU.
2. **Domain/Subdomain (Opsional tapi Sangat Disarankan):** Untuk mengaktifkan HTTPS. Contoh:
   - `api.tumbasna.com` (untuk Dashboard & Backend)
   - `app.tumbasna.com` (untuk Mobile Web Preview)
3. **Akun Supabase:** (Karena database PostgreSQL Anda saat ini menggunakan Supabase cloud, Anda tidak perlu menginstal database lokal di VPS).

---

## 2. Instalasi Kebutuhan di VPS (Docker & Nginx)

Masuk ke VPS Anda menggunakan SSH (contoh: `ssh root@ip_vps_anda`), lalu jalankan perintah berikut untuk menginstal Docker, Git, dan Nginx:

```bash
# Update package ubuntu
sudo apt update && sudo apt upgrade -y

# Instal Git dan Nginx
sudo apt install git nginx -y

# Instal Docker & Docker Compose
sudo apt-get install ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

---

## 3. Clone Repository & Setup Environment

Bawa *source code* Tumbasna Anda ke VPS.

```bash
# Clone proyek Anda (sesuaikan dengan URL repository Git Anda)
git clone https://github.com/username/tumbasna.git
cd tumbasna

# Setup Environment Variables
# 1. Dashboard
cp tumbasna-dashboard/.env.example tumbasna-dashboard/.env
nano tumbasna-dashboard/.env # Masukkan DATABASE_URL Supabase, NEXT_PUBLIC_BASE_URL (URL VPS), dan API Keys

# 2. WhatsApp Bot
cp tumbasna-whatsapp/.env.example tumbasna-whatsapp/.env
nano tumbasna-whatsapp/.env 
# Masukkan OPENAI_API_KEY, set ENABLE_REAL_WA=true
# PENTING: Ubah API_URL menunjuk ke URL/IP VPS Anda port 3000 (contoh: http://ip_vps:3000)
```

---

## 4. Jalankan Dashboard API & WA Bot (Menggunakan Docker)

Karena proyek Anda sudah dilengkapi file `docker-compose.yml`, men-deploy backend sangatlah mudah.

```bash
# Dari root folder tumbasna
sudo docker compose up -d --build
```
*Tunggu hingga proses build selesai. Jika berhasil, Dashboard API akan berjalan di port `3000` dan WA Bot di port `3002`.*

**Aktivasi Bot WhatsApp:**
Untuk menyambungkan nomor WhatsApp, lihat log dari WA Bot untuk men-scan QR Code:
```bash
sudo docker compose logs -f whatsapp-bot
```
*Scan QR code yang muncul di terminal menggunakan aplikasi WhatsApp di HP. Tekan `Ctrl+C` untuk keluar dari log.*

---

## 5. Konfigurasi Nginx (Reverse Proxy & HTTPS)

Agar tim Anda tidak perlu mengetikkan port (seperti `:3000`), kita gunakan Nginx untuk mem-forward traffic dari domain ke aplikasi.

```bash
sudo nano /etc/nginx/sites-available/tumbasna
```

Masukkan konfigurasi berikut (ganti `api.domainanda.com` dengan IP VPS atau Domain Anda):

```nginx
server {
    listen 80;
    server_name api.domainanda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tumbasna /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

*(Opsional) Instal SSL dengan Certbot:*
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.domainanda.com
```

---

## 6. Deploy Mobile App (Frontend)

Untuk Tumbasna Mobile (Ionic React), karena digunakan oleh pengguna, Anda bisa membangunnya (build) menjadi format Web App dan menaruhnya di layanan gratis seperti **Vercel**, **Netlify**, atau men-host *static files*-nya langsung di Nginx VPS Anda.

**PENTING: Sebelum di-build, ubah URL API!**
Buka kode aplikasi mobile Anda, cari konfigurasi koneksi API (biasanya di file seperti `api.ts`, `axios.ts`, atau `constants`), dan ubah URL API lokal (`http://localhost:3000`) menjadi URL publik server Anda (`https://api.domainanda.com`).

**Cara mudah untuk preview Web App via VPS (Nginx):**
1. Di komputer lokal Anda (bukan VPS), jalankan build:
   ```bash
   cd tumbasna-mobile
   npm run build
   ```
2. Anda akan mendapatkan folder `dist` (atau `build`). Upload folder `dist` tersebut ke VPS Anda, letakkan di direktori `/var/www/tumbasna-mobile`.
3. Buat konfigurasi Nginx baru yang menunjuk folder statis tersebut (contoh ke domain `app.domainanda.com`).

---

## 🎊 Selesai!

Sekarang ekosistem Anda siap diuji coba oleh tim Anda dari manapun:
1. **Dashboard & API:** `http://api.domainanda.com`
2. **Mobile App:** `http://app.domainanda.com` (atau APK jika di-build dengan Android Studio/Capacitor)
3. **WhatsApp Bot:** Berjalan otomatis di latar belakang menanggapi pesan pengguna.
