#!/bin/bash

# Script Deploy Tumbasna (DOCKER VERSION)
# Cara penggunaan: ./deploy.sh
# Pastikan script ini dijalankan dari dalam root folder project di VPS Anda (misal: /opt/tumbasna)

echo "========================================"
echo "🚀 Memulai Deployment Tumbasna (Docker)"
echo "========================================"

# 1. Git Pull
echo "📥 1. Mengambil update terbaru dari Git..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Gagal melakukan git pull. Cek koneksi atau konflik."
    exit 1
fi

# 2. Build ulang dan Jalankan Container Docker
echo "========================================"
echo "🐳 2. Melakukan Build & Restart Docker Container..."
echo "========================================"
docker compose down
docker compose build
docker compose up -d

# Membersihkan image yang tidak terpakai (opsional, agar VPS tidak penuh)
docker image prune -f

# 3. Build Mobile App on Host (jika Nginx menyajikan static files secara langsung)
echo "========================================"
echo "📱 3. Membangun Mobile Web App di VPS Host..."
echo "========================================"
if [ -d "tumbasna-mobile" ]; then
    cd tumbasna-mobile
    echo "Installing mobile dependencies..."
    npm install
    echo "Building mobile app..."
    npm run build
    
    # Copy ke folder Nginx static jika ada
    if [ -d "/var/www/tumbasna-mobile" ]; then
        echo "Copying build to /var/www/tumbasna-mobile..."
        sudo cp -r dist/* /var/www/tumbasna-mobile/
    else
        echo "Target directory /var/www/tumbasna-mobile not found, files are built in tumbasna-mobile/dist"
    fi
    cd ..
else
    echo "tumbasna-mobile directory not found!"
fi

# 4. Diagnostics (melihat konfigurasi Nginx dan status proses di VPS)
echo "========================================"
echo "🔍 4. Menjalankan Diagnostik VPS..."
echo "========================================"
echo "--- Nginx Sites Configurations ---"
for config in /etc/nginx/sites-enabled/*; do
    if [ -f "$config" ]; then
        echo "File: $config"
        cat "$config"
        echo "----------------------------------"
    fi
done

echo "--- PM2 Status ---"
pm2 status 2>/dev/null || echo "PM2 not running or not in PATH"

echo "--- Docker Containers ---"
docker ps

echo "========================================"
echo "✅ Deployment Tumbasna Selesai!"
echo "========================================"
echo "Untuk melihat status container, jalankan: docker compose ps"

