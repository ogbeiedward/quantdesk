FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Run the dev server. Since host: true is in vite.config.ts, it will bind to 0.0.0.0
CMD ["npm", "run", "dev"]
