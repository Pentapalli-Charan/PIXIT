# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using lockfile
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Build-time environment variable to target backend container
ARG VITE_API_URL="http://localhost:8000"
ENV VITE_API_URL=$VITE_API_URL

# Build optimized production output
RUN npm run build


# --- Runtime Stage ---
FROM nginx:alpine

# Copy custom nginx configuration for routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build assets to default nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
