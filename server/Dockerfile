FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY server/ ./server/
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production

COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/package.json ./package.json

EXPOSE 4000
CMD ["npm", "start"]
