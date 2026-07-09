# Tahap Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# .env file harus tersedia saat build karena Vite membutuhkan VITE_* vars di build time
RUN npm run build

# Tahap Jalankan dengan Nginx Web Server
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Konfigurasi agar routing aplikasi web SPA tidak error 404 saat direfresh
# Juga menambahkan header cache-control untuk service worker dan manifest
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /sw.js { \
        root /usr/share/nginx/html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
    } \
    location /manifest.json { \
        root /usr/share/nginx/html; \
        add_header Cache-Control "no-cache"; \
        add_header Content-Type "application/manifest+json"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
