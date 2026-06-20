FROM node:22-alpine
WORKDIR /app
COPY mcp/package*.json ./
RUN npm ci --omit=dev
COPY mcp/ ./
RUN npm run build
EXPOSE 8787
CMD ["node", "dist/src/http.js"]
