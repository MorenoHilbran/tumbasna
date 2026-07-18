#!/bin/bash

# Script Deploy Tumbasna (DOCKER VERSION)
# Cara penggunaan: ./deploy.sh
# Pastikan script ini dijalankan dari dalam root folder project di VPS Anda (misal: /opt/tumbasna)

echo "========================================"
echo "🚀 Memulai Deployment Tumbasna (Docker)"
echo "========================================"

# 1. Git Pull (Force Sync)
echo "📥 1. Mengambil update terbaru dari Git..."
git fetch --all
git reset --hard origin/main

if [ $? -ne 0 ]; then
    echo "❌ Gagal melakukan git sync. Cek koneksi."
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
DIAG_FILE="/opt/tumbasna/tumbasna-dashboard/public/diagnostics.txt"
echo "=== VPS Diagnostics Run at $(date) ===" > "$DIAG_FILE"

echo "" >> "$DIAG_FILE"
echo "--- Directory Structure ---" >> "$DIAG_FILE"
ls -la /var/www >> "$DIAG_FILE" 2>&1
echo "----------------------------------" >> "$DIAG_FILE"

echo "" >> "$DIAG_FILE"
echo "--- Nginx Sites Configurations ---" >> "$DIAG_FILE"
for config in /etc/nginx/sites-enabled/*; do
    if [ -f "$config" ]; then
        echo "File: $config" >> "$DIAG_FILE"
        cat "$config" >> "$DIAG_FILE"
        echo "----------------------------------" >> "$DIAG_FILE"
    fi
done

echo "" >> "$DIAG_FILE"
echo "--- PM2 Status ---" >> "$DIAG_FILE"
pm2 status >> "$DIAG_FILE" 2>&1 || echo "PM2 not running or not in PATH" >> "$DIAG_FILE"

echo "" >> "$DIAG_FILE"
echo "--- Docker Containers ---" >> "$DIAG_FILE"
docker ps >> "$DIAG_FILE" 2>&1

echo "" >> "$DIAG_FILE"
echo "--- Mobile App Dist Modification Timestamp ---" >> "$DIAG_FILE"
ls -la /opt/tumbasna/tumbasna-mobile/dist >> "$DIAG_FILE" 2>&1

echo "========================================"
echo "✅ Diagnostics written to $DIAG_FILE"
echo "========================================"
echo "========================================"
echo "✅ Deployment Tumbasna Selesai!"
echo "========================================"
echo "Untuk melihat status container, jalankan: docker compose ps"


