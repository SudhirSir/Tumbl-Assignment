FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY client/ ./client/
WORKDIR /app/client
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
