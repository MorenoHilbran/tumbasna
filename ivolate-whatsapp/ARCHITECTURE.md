# Arsitektur & Alur Kerja Ivolate WhatsApp Bot

Dokumen ini menjelaskan struktur folder (Clean Architecture) terbaru dari `ivolate-whatsapp` beserta urutan perjalanan (Flow) pemrosesan obrolan pesan WhatsApp hingga masuk ke Database.

## 📂 Struktur Direktori Terbaru

Sistem telah dirombak menggunakan konsep *Separation of Concerns* agar siap dikembangkan untuk skala besar *(Production Ready)*:

```text
src/
├── ai/
│   ├── agent.ts             # Orkestrator utama LangChain LLM
│   ├── memory.ts            # Fetch/Save payload History (ChatSession) ke Database
│   └── prompts.ts           # Definisi Instruksi Statis (System Prompts) AI
├── bot/
│   └── baileys.ts           # Setup mesin penyadap WhatsApp Baileys MD
├── handlers/
│   └── messageHandler.ts    # Filter pesan masuk dan Decision Maker
├── routes/
│   └── index.ts             # Kumpulan Endpoint Express.js (/api/send, /test)
├── services/
│   ├── apiService.ts        # Kumpulan Axios API Request ke Dashboard Next.js
│   ├── whatsappClient.ts    # Singleton Class pengelola Instance Socket WA
│   └── geminiServiceLegacy.ts # (Deprecated) Modul versi terdahulu
├── types/
│   └── index.ts             # Sentralisasi definisi Interfaces (Typescript)
├── utils/
│   └── messageParser.ts     # Alat pembersih karakter mentah 
└── index.ts                 # Bootstrapper Murni & Express Server Listener
```

---

## 🚀 Alur Kerja Pemrosesan Pesan (*Sequence Flow*)

Bagaimana sebuah pesan dari pengguna WhatsApp seperti *"Saya mau jual petai 10 Kilo"* bisa diproses hingga terkirim otomatis ke Database Next.js Dashboard? Berikut adalah urutannya:

### 1. Pintu Masuk (*Entry Point*)
Pesan teks asli ditangkap oleh *Listener* di `src/bot/baileys.ts`. File ini bertugas mengekstrak bagian teks dari data mentah Whatsapp, lalu segera "melempar" pesan tersebut ke Si Manajer Tugas: `src/handlers/messageHandler.ts`.

### 2. Otak AI Memproses (*LangChain Agent Layer*)
Karena `messageHandler.ts` tidak dirancang untuk memahami bahasa manusia, ia menyuruh Asisten Pakar AI di folder `src/ai/agent.ts` untuk memahaminya.
Di dalam `agent.ts`, terjadilah siklus intelektual berikut:
1. **Panggil Ingatan (Memory Load)**: `agent.ts` meminta bantuan `src/ai/memory.ts` untuk melakukan koneksi REST API ke Next.js Dashboard (`GET /api/session`) guna melihat apakah percakapan dengan nomor unik ini sudah ada atau belum.
2. **Baca Buku Pegangan (System Prompt)**: `agent.ts` memuat modul `src/ai/prompts.ts` guna menanamkan batasan ketat (Seperti paksaan format keluaran dan aturan dilarang halusinasi).
3. **Mulai Berpikir (Invoke LLM)**: Data masa lalu, instruksi baru, dan pesan teks pengguna dikemas dan dikirimkan ke model *OpenAI-Compatible (Claude/SemutSSH)*. 
4. **Catat Ingatan (Memory Save)**: Setelah mendapatkan balasan berupa format JSON, `memory.ts` bertugas mengirim histori *"Chat Masa Lalu + Chat Barusan"* kembali ke Next.js Database (`POST /api/session`) agar memori ini terus bersambung.
5. **Kembalikan Hasil (Return)**: `agent.ts` menyerahkan hasil ekstraksi (*JSON ParsedData*) kembali kepada Manajer Tugas `messageHandler.ts`.

### 3. Eksekusi (*Action & API Layer*)
Fase terakhir. Sang Manajer Tugas `messageHandler.ts` kini memegang informasi terstruktur murni (Contoh: `intent: SUPPLY`, `status: COMPLETE`, `items: Petai 10 Kg`).
- **Validasi Penyelesaian**: Manajer secara otomatis akan menembak asisten `src/services/apiService.ts` (*POST /api/supply* atau *POST /api/demand*).
- **Notifikasi Pencocokan**: API Next.js akan memproses rekaman entri ke Supabase. Apabila terjadi penemuan *Match*, Next.js akan menembak *WebHook* Endpoint kita (`/api/send` di `src/routes/index.ts`) menggunakan socket yang ada di `whatsappClient.ts` untuk mengirim notifikasi sukses rahasia ke WhatsApp Pengguna.
- **Balasan Terakhir**: Walaupun tidak masuk skenario *Complete* bersyarat, di paling penghujung kode, `messageHandler.ts` tetap akan membalas chat WA ke pengguna dengan kata-kata manis yang telah disusun oleh AI tadi (seperti: *"Sisa stok apa lagi yang ingin Bapak tambahkan?"*).

---

Sistem di atas menghilangkan tumpang-tindih peran antar folder sehingga perbaikan kode di satu fitur tidak akan merusak keseluruhan aplikasi bot.
