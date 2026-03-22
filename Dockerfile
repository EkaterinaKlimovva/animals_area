FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY config ./config
COPY src ./src

RUN npx prisma generate && npm run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]