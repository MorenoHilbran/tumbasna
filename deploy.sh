#!/bin/bash

# Script Deploy Tumbasna (DOCKER VERSION)
# Cara penggunaan: ./deploy.sh
# Pastikan script ini dijalankan dari dalam root folder project di VPS Anda (misal: /opt/tumbasna)

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

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
    npm install --no-audit --no-fund --prefer-offline > /tmp/mobile_build.log 2>&1
    echo "Building mobile app..."
    VITE_PAYMENT_MODE=api VITE_API_URL=https://api.tumbasna.my.id npm run build >> /tmp/mobile_build.log 2>&1
    
    # Copy ke folder Nginx static /var/www/tumbasna-mobile
    echo "Copying build to /var/www/tumbasna-mobile..."
    mkdir -p /var/www/tumbasna-mobile
    cp -r dist/* /var/www/tumbasna-mobile/
    chmod -R 755 /var/www/tumbasna-mobile
    chmod -R 755 /opt/tumbasna/tumbasna-mobile/dist 2>/dev/null || true
    cd ..
else
    echo "tumbasna-mobile directory not found!"
fi

# 3.1 Update Nginx Config to serve mobile statically on host
echo "========================================"
echo "🔧 3.1 Memperbarui Konfigurasi Nginx VPS..."
echo "========================================"
if [ -f "nginx-sites-tumbasna.conf" ]; then
    echo "Applying nginx-sites-tumbasna.conf..."
    cp nginx-sites-tumbasna.conf /etc/nginx/sites-enabled/tumbasna
    nginx -t && systemctl reload nginx
    echo "✓ Nginx reloaded successfully!"
else
    echo "nginx-sites-tumbasna.conf not found!"
fi

# 4. Diagnostics (melihat konfigurasi Nginx dan status proses di VPS)
echo "========================================"
echo "🔍 4. Menjalankan Diagnostik VPS..."
echo "========================================"
DIAG_FILE="/tmp/diagnostics.txt"
echo "=== VPS Diagnostics Run at $(date) ===" > "$DIAG_FILE"

echo "" >> "$DIAG_FILE"
echo "--- Mobile Build Log ---" >> "$DIAG_FILE"
cat /tmp/mobile_build.log >> "$DIAG_FILE" 2>&1
echo "----------------------------------" >> "$DIAG_FILE"

echo "" >> "$DIAG_FILE"
echo "--- Directory Structure ---" >> "$DIAG_FILE"
ls -la /var/www >> "$DIAG_FILE" 2>&1
ls -la /var/www/tumbasna-mobile >> "$DIAG_FILE" 2>&1
ls -la /opt/tumbasna/tumbasna-mobile >> "$DIAG_FILE" 2>&1
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

# Copy diagnostics ke Nginx web directories jika ada
if [ -d "/var/www/tumbasna-mobile" ]; then
    cp "$DIAG_FILE" /var/www/tumbasna-mobile/diagnostics.txt
    chmod 644 /var/www/tumbasna-mobile/diagnostics.txt
fi
if [ -d "/var/www/html" ]; then
    cp "$DIAG_FILE" /var/www/html/diagnostics.txt
    chmod 644 /var/www/html/diagnostics.txt
fi

echo "========================================"
echo "✅ Diagnostics copied to web root directories"
echo "========================================"
echo "========================================"
echo "✅ Deployment Tumbasna Selesai!"
echo "========================================"
echo "Untuk melihat status container, jalankan: docker compose ps"



