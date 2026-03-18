FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Cloud Run injects PORT; fallback to 3000 for local docker runs
ENV PORT=3000
EXPOSE $PORT

CMD ["node", "index.js"]
