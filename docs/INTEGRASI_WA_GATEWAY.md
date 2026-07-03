# 🟢 Integrasi WhatsApp Gateway — Status Report

> **Tanggal:** 2 Juli 2026  
> **Status:** ✅ Arsitektur Lengkap | ❌ Belum Operasional  
> **Estimasi Aktivasi:** 30 menit — 1 jam (setelah API key tersedia)

---

## Ringkasan

Tumbasna memiliki **2 jalur WhatsApp** yang sudah **fully coded** tapi belum bisa digunakan karena belum dikonfigurasi.

| Jalur | Library | Port | Status Kode | Operasional? |
|-------|---------|------|-------------|--------------|
| **Direct (Baileys)** | `@whiskeysockets/baileys` v6.7.16 | 3002 | ✅ Complete | ❌ No |
| **Webhook (Fonnte)** | REST API via `transactions.ts` | 3000 | ✅ Complete | ❌ No |

---

## Jalur 1: Baileys (tumbasna-whatsapp)

### Fitur Yang Sudah Diimplementasi
- ✅ WhatsApp Multi-Device via Baileys
- ✅ QR code scan (terminal + API endpoint)
- ✅ Auto-reconnect saat disconnect
- ✅ LangChain AI agent untuk NLP
- ✅ Multi-turn conversation memory
- ✅ Intent detection (SUPPLY, DEMAND, CANCEL, INQUIRY, LIST, UNKNOWN)
- ✅ Structured JSON extraction (komoditas, berat, harga, lokasi, telepon)
- ✅ Commodity validation (hanya komoditas pertanian/pangan)
- ✅ Phone number normalization (08xx → 628xx)
- ✅ Match notification via wa.me links
- ✅ Auth middleware (secret key)
- ✅ Test simulation endpoint
- ✅ Login/logout/status API
- ✅ Docker support

### API Endpoints

```
GET  /health                    → Health check
GET  /api/auth/status           → Connection status + QR code [AUTH]
GET  /api/auth/qr-image         → QR code as PNG [AUTH]
POST /api/auth/login            → Start bot connection [AUTH]
POST /api/auth/logout           → Disconnect + clear session [AUTH]
POST /api/send                  → Send message to phone number [AUTH]
POST /test/simulate-message     → Simulate incoming message [NO AUTH]
```

### Blockers
1. **`OPENAI_API_KEY` kosong** → AI tidak bisa proses pesan
2. **`ENABLE_REAL_WA=false`** → Pesan WA real diabaikan
3. **Session kosong** → Belum ada scan QR

### Cara Mengaktifkan
```bash
# 1. Edit .env
cd tumbasna-whatsapp
# Set: OPENAI_API_KEY="your-key"
# Set: ENABLE_REAL_WA=true

# 2. Jalankan
npm run dev

# 3. Scan QR code di terminal

# 4. Test
curl -X POST http://localhost:3002/test/simulate-message \
  -H "Content-Type: application/json" \
  -d '{"phone":"6281234567890","message":"jual cabai 100kg 50rb malang"}'
```

---

## Jalur 2: Fonnte (tumbasna-dashboard)

### Fitur Yang Sudah Diimplementasi
- ✅ Webhook receiver (`POST /api/webhook/wa`)
- ✅ Gemini AI extraction langsung
- ✅ Smart Matching Engine terintegrasi
- ✅ Auto-create user dari nomor WA
- ✅ Transaction lifecycle (TRX code, AMBIL, SUKSES, BATAL)
- ✅ Follow-up messages
- ✅ Geocoding otomatis

### Blockers
1. **`FONNTE_TOKEN` belum diisi** → Tidak bisa kirim pesan
2. **`GEMINI_API_KEY` belum diisi** → AI extraction gagal
3. **Webhook URL belum di-setup** → Fonnte tidak bisa kirim pesan masuk

### Cara Mengaktifkan
```bash
# 1. Edit .env
cd tumbasna-dashboard
# Set: FONNTE_TOKEN="token-dari-fonnte.com"
# Set: GEMINI_API_KEY="key-dari-google-ai-studio"

# 2. Jalankan dashboard
npm run dev

# 3. Setup ngrok untuk development
ngrok http 3000

# 4. Copy ngrok URL ke Fonnte dashboard
# Webhook URL: https://xxxx.ngrok.io/api/webhook/wa
```

---

## Rekomendasi

1. **Untuk Development/Testing:** Gunakan Jalur 1 (Baileys) + `/test/simulate-message`
2. **Untuk Production:** Gunakan Jalur 2 (Fonnte) — lebih stabil, tidak perlu QR scan ulang
3. **Ideal:** Jalankan keduanya — Baileys untuk direct messaging, Fonnte untuk webhook reliability

---

## Verdict

> **🟡 WA Gateway BELUM BISA DIGUNAKAN tapi sudah SIAP secara arsitektur.**
>
> Tidak ada kode yang perlu ditulis. Hanya perlu:
> 1. API key (OpenAI/Gemini)
> 2. Fonnte token
> 3. Konfigurasi .env
> 4. QR scan (Baileys)
