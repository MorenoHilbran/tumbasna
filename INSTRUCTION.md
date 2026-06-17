# Tumbasna - Matching Platform Demand-Supply Pangan

Platform boilerplate menggunakan **Next.js 14**, **Prisma ORM**, dan **WhatsApp Webhook** (Fonnte/Twilio) terintegrasi dengan **Gemini AI**.

## Spesifikasi
- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Peta/Hotspot**: React Leaflet (OpenStreetMap)
- **Database**: PostgreSQL (Prisma)
- **AI Extraction**: Google Gemini Pro (extract message -> JSON format)
- **Geocoding API**: Nominatim OpenStreetMap (Mencari koordinat dr text lokasi)
- **Webhook**: Menerima interaksi supply/demand dari WhatsApp API.

## Cara Menjalankan Secara Lokal

### 1. Prasyarat Dependencies
Pastikan bahwa Anda telah menginstall:
- [Node.js](https://nodejs.org/) (Rekomendasi v18+)
- [PostgreSQL](https://www.postgresql.org/) (Dijalankan secara lokal atau melalui cloud seperti Supabase/Neon).
- [Ngrok](https://ngrok.com/) (Untuk mengekspos endpoint ke public agar Whatsapp webhook bisa ditembak)

### 2. Setup Repository
Jalankan instalasi dependencies jika belum:
\`\`\`bash
npm install
\`\`\`

### 3. Konfigurasi Environment (ENV)
Buat file \`.env\` pada root folder (sejajar dengan package.json) dengan isi:
\`\`\`env
# URL Database Postgres Anda. Contoh:
DATABASE_URL="postgresql://postgres:password@localhost:5432/tumbasna_db?schema=public"

# Google Gemini API Key untuk logic extraksi teks natural WA ke object
GEMINI_API_KEY="AIzaSyAXXXX_YOUR_GEMINI_KEY"
\`\`\`

### 4. Setup Prisma Schema
Jalankan migrasi untuk men-generate relasi tabel dan Push ke DB anda:
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

### 5. Start Development Server
Jalankan Next.js di lokal dengan perintah:
\`\`\`bash
npm run dev
\`\`\`
Server akan berjalan di \`http://localhost:3000\`.
Dashboard monitoring akses di: \`http://localhost:3000/dashboard\`

---

## 6. Integrasi Webhook dengan Ngrok (Agar WA API bisa tembak ke Local)
Biarkan \`npm run dev\` menyala di terminal pertama.
Buka **terminal baru** untuk proxy Ngrok.

Jalankan:
\`\`\`bash
ngrok http 3000
\`\`\`

**Langkah Terakhir (Webhook Setup):**
1. Copy **Forwarding URL** HTTPS dari console ngrok (misal: \`https://68af-xxxx.ngrok-free.app\`).
2. Masukkan ke platform layanan WA API Anda (misal Fonnte / Twilio Webhook URL).
3. Set URL Webhook tersebut mengarah ke struktur route aplikasi: 
   👉 \`https://[YOUR_NGROK_ID].ngrok-free.app/api/webhook/wa\`
4. Semua pesan WA (`POST` request) yang masuk sekarang akan melewati proses AI Extraction dan dicatat ke PostgreSQL!
