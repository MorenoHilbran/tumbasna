#!/bin/bash

# Script Deploy Tumbasna (DOCKER VERSION OPTIMIZED)
# Cara penggunaan: ./deploy.sh
# Pastikan script ini dijalankan dari dalam root folder project di VPS Anda (misal: /opt/tumbasna)

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "========================================"
echo "🚀 Memulai Deployment Tumbasna (Docker)"
echo "========================================"

# 0. Cek & Auto-create Swap Memory jika belum ada (Mencegah VPS Freeze / Out-Of-Memory)
if [ $(swapon --show | wc -l) -le 1 ]; then
    echo "⚠️ Swap Memory belum aktif. Membuat 2GB Swapfile..."
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab 2>/dev/null || true
    echo "✓ 2GB Swap Memory berhasil diaktifkan!"
fi

# 1. Git Pull (Force Sync)
echo "📥 1. Mengambil update terbaru dari Git..."
git fetch --all
git reset --hard origin/main

if [ $? -ne 0 ]; then
    echo "❌ Gagal melakukan git sync. Cek koneksi."
    exit 1
fi

# 2. Build dan Jalankan Container Docker (Dashboard + WA Bot)
echo "========================================"
echo "🐳 2. Melakukan Build & Restart Docker Container..."
echo "========================================"
docker compose up -d --build

# Membersihkan image lama yang tidak terpakai
docker image prune -f

# 3. Build Mobile App di VPS Host (Disajikan via Nginx static /var/www/tumbasna-mobile)
echo "========================================"
echo "📱 3. Membangun Mobile Web App di VPS Host..."
echo "========================================"
if [ -d "tumbasna-mobile" ]; then
    cd tumbasna-mobile
    
    # Hanya jalankan npm install jika node_modules belum ada
    if [ ! -d "node_modules" ]; then
        echo "Installing mobile dependencies..."
        npm install --no-audit --no-fund --prefer-offline > /tmp/mobile_build.log 2>&1
    fi
    
    echo "Building mobile app..."
    VITE_PAYMENT_MODE=api VITE_API_URL=https://api.tumbasna.my.id npm run build > /tmp/mobile_build.log 2>&1
    
    # Copy ke folder Nginx static /var/www/tumbasna-mobile
    echo "Copying build to /var/www/tumbasna-mobile..."
    mkdir -p /var/www/tumbasna-mobile
    cp -r dist/* /var/www/tumbasna-mobile/
    chmod -R 755 /var/www/tumbasna-mobile
    cd ..
else
    echo "tumbasna-mobile directory not found!"
fi

# 3.1 Update Nginx Config jika ada perubahan
echo "========================================"
echo "🔧 3.1 Memperbarui Konfigurasi Nginx VPS..."
echo "========================================"
if [ -f "nginx-sites-tumbasna.conf" ]; then
    cp nginx-sites-tumbasna.conf /etc/nginx/sites-enabled/tumbasna
    nginx -t && systemctl reload nginx
    echo "✓ Nginx reloaded successfully!"
fi

echo "========================================"
echo "✅ Deployment Tumbasna Selesai!"
echo "========================================"
docker compose ps
