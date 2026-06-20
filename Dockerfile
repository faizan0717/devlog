FROM node:22-alpine AS builder
WORKDIR /app
COPY mcp/package*.json ./
RUN npm ci
COPY mcp/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY mcp/package*.json ./
RUN npm ci --omit=dev
EXPOSE 8787
CMD ["node", "dist/src/http.js"]
