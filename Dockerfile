
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl postgresql-client

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY prisma ./prisma
COPY config ./config
COPY src ./src

RUN npx prisma generate && npm run build

EXPOSE 8080

CMD ["sh", "-c", "until pg_isready -h database -p 5432 -U postgres; do echo 'Waiting for database...'; sleep 2; done && npx prisma db push && node dist/src/index.js"]