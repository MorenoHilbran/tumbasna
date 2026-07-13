FROM node:20-bookworm

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

ARG DATABASE_URL
ARG DIRECT_URL

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

RUN npm run build

EXPOSE 3000

CMD ["npm","start"]