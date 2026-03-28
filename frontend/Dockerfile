# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Handle build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
# Build the production assets
RUN npm run build


# Final stage - use a simple node server to serve the static files
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
# Serve the dist folder on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
