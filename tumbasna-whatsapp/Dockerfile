FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund --prefer-offline

COPY . .

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev --no-audit --no-fund --prefer-offline

COPY --from=builder /app/dist ./dist

RUN mkdir -p session

CMD ["npm","run","start"]