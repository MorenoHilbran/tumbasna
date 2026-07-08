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

echo "========================================"
echo "✅ Deployment Tumbasna Selesai!"
echo "========================================"
echo "Untuk melihat status container, jalankan: docker compose ps"
