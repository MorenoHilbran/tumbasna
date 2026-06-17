# Tahap 1: Build (Dependencies & Compile TypeScript)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy daftar dependensi
COPY package*.json ./

# Install seluruh dependensi (termasuk devDependencies untuk tsc)
RUN npm install

# Copy source code penuh
COPY . .

# Compile Typescript ke JavaScript (folder dist/)
RUN npm run build

# Tahap 2: Production (Image lebih ringan, tanpa devDependencies)
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package.json lagi
COPY package*.json ./

# Hanya install produksi
RUN npm install --omit=dev

# Copy hasil build JS dari Tahap 1
COPY --from=builder /app/dist ./dist

# Persiapkan folder session
RUN mkdir -p session

# Start container
CMD ["npm", "run", "start"]
