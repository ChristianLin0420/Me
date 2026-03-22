FROM node:20-slim

WORKDIR /app

# Install all deps (tsx is in devDeps but needed at runtime)
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy source and build frontend
COPY . .
RUN npm run build

EXPOSE 3000

ENV DB_DIR=/data
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "--import", "tsx", "server.ts"]
