FROM node:20-alpine AS builder
RUN apk add --no-cache tzdata
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV DATABASE_URL=postgresql://user:password@localhost:5432/db?schema=public
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# Firebase credential nạp qua biến môi trường FIREBASE_SERVICE_ACCOUNT (xem .env.prod.example),
# không bake private key vào image.
COPY --from=builder /app/start.sh ./start.sh
RUN sed -i 's/\r$//' ./start.sh && chmod +x ./start.sh
EXPOSE 4000
CMD ["./start.sh"]
