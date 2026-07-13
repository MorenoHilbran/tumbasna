# 🚀 QUICK START GUIDE - TUMBASNA NEW CHECKOUT FLOW

## 📋 CHECKLIST: Apa yang Perlu Anda Lakukan?

### ☑️ STEP 1: Check WhatsApp Bot (5 menit)

```bash
# Login ke VPS
ssh moreno@202.155.13.225

# Check if bot is running
pm2 list

# Jika bot tidak running, start:
cd /opt/tumbasna/tumbasna-whatsapp
pm2 restart tumbasna-whatsapp

# Test dari dalam VPS
curl http://localhost:3002/health

# Jika berhasil, Anda akan lihat:
# {"status":"ok","uptime":12345}

# Exit VPS
exit
```

**Copy-paste output pm2 list ke sini** → Saya akan analisis

---

### ☑️ STEP 2: Get Correct WhatsApp Bot URL (2 menit)

Cek file nginx config untuk melihat URL yang benar:

```bash
ssh moreno@202.155.13.225
cat /etc/nginx/sites-enabled/tumbasna

# Look for location blocks that proxy to port 3002
# Example output:
# location /wa {
#     proxy_pass http://localhost:3002;
# }
```

Dari output di atas, URL yang benar adalah:
- `https://api.tumbasna.com/wa` ✅
- Atau `https://wa.tumbasna.com` ✅

**Berikan URL yang benar ke saya** → Saya akan update .env

---

### ☑️ STEP 3: Approve Database Migration (1 menit)

Saya sudah buat SQL migration script yang aman. Ini akan:
- ✅ Add kolom baru (tidak break existing data)
- ✅ Create tabel baru (tidak affect existing tables)
- ✅ Add indexes untuk performance
- ✅ Add default values untuk existing records

**Apakah Anda approve untuk run migration?**
- [ ] Yes, run it now
- [ ] Yes, but run saat off-peak hours
- [ ] Need to review SQL first

---

### ☑️ STEP 4: Choose Development Priority

**Opsi A: Fix WA Bot First** (Recommended)
- Pros: Order notifications akan langsung work
- Cons: UI baru belum bisa ditest
- Time: ~30 menit

**Opsi B: Build UI First**
- Pros: User bisa lihat flow baru
- Cons: WA notification tetap tidak work
- Time: ~2-3 jam

**Pilihan Anda:** A atau B?

---

## 🔧 TROUBLESHOOTING COMMANDS

### If WhatsApp Bot Not Running:

```bash
ssh moreno@202.155.13.225
cd /opt/tumbasna/tumbasna-whatsapp

# Check logs
pm2 logs tumbasna-whatsapp --lines 50

# Restart bot
pm2 restart tumbasna-whatsapp

# If still not working, rebuild:
npm install
npm run build
pm2 restart tumbasna-whatsapp
```

### If Port 3002 Blocked:

```bash
# Check firewall
sudo ufw status

# Allow port 3002
sudo ufw allow 3002/tcp
sudo ufw reload

# Verify port is listening
sudo netstat -tlnp | grep 3002
```

### If Need to Update Nginx:

```bash
sudo nano /etc/nginx/sites-enabled/tumbasna

# Add this block if not exists:
location /wa {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # Remove /wa prefix
    rewrite ^/wa/(.*) /$1 break;
}

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## 📞 CONTACT INFORMATION NEEDED

Tolong isi form ini dan reply:

```
=== TUMBASNA VPS INFO ===

1. WhatsApp Bot Status:
   [ ] Running
   [ ] Not Running
   [ ] Unknown
   
2. URL Production:
   Domain/Subdomain: _______________
   
3. PM2 List Output:
   (paste here)
   
4. Curl Test Result:
   $ curl http://localhost:3002/health
   (paste result)
   
5. Database Migration:
   [ ] Approved - Run now
   [ ] Approved - Schedule later
   [ ] Need review first
   
6. Development Priority:
   [ ] Fix WA Bot First (Opsi A)
   [ ] Build UI First (Opsi B)
   
7. Target Timeline:
   Production ready by: _______________
```

---

## 📚 FILES CREATED TODAY

1. **src/components/CartPillBar.tsx**
   - Full-featured cart pill bar
   - Ready to use

2. **src/lib/shipping.ts**
   - Shipping calculator utility
   - Zone-based pricing

3. **src/app/api/orders/batch/route.ts**
   - Multi-supplier order creation
   - WhatsApp notification integration

4. **prisma/migrations/add_delivery_scheduling.sql**
   - Database schema updates
   - Ready to run

5. **Documentation (5 files)**
   - Complete analysis & guides

---

## ⚡ QUICK DEPLOY (After Info Received)

Once you provide the info above, deployment akan cepat:

```bash
# 1. Update .env with correct WA URL
WHATSAPP_BOT_URL="https://api.tumbasna.com/wa"

# 2. Run migration
# (Copy-paste SQL via Supabase dashboard)

# 3. Test batch order API
curl -X POST http://localhost:3000/api/orders/batch \
  -H "Content-Type: application/json" \
  -d @test-order.json

# 4. Verify WA notification sent
# Check supplier phone for message

# 5. Build & deploy UI
npm run build
pm2 restart tumbasna-dashboard
```

**Estimated time: 30-60 minutes total**

---

## 🎯 WAITING FOR YOUR INPUT

Please provide:
1. ✅ PM2 list output
2. ✅ Correct WhatsApp bot URL
3. ✅ Database migration approval
4. ✅ Development priority (A or B)

**Once I have this info, we can continue immediately!** 🚀

---

*Last updated: 2026-07-13 13:29 WIB*
