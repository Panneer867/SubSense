FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Build Vite frontend
RUN npm run build

# Expose Cloud Run default port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npx", "tsx", "server.ts"]
