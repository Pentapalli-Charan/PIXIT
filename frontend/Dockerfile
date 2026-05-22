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

# Set default port to 80 for local development/Jenkins compatibility
ENV PORT=80
# Restrict envsubst to ONLY replace the PORT variable, leaving Nginx's internal $uri variables intact
ENV NGINX_ENVSUBST_FILTER=PORT

# Copy custom nginx configuration as a template for envsubst processing
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy build assets to default nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
