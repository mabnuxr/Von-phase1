# Multi-stage Dockerfile for Storybook

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy all source files
COPY . .

# Build Storybook for production
RUN npm run build-storybook

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Stage 2: Production stage with nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk --no-cache add curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Storybook from builder stage
COPY --from=builder /app/storybook-static /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-group nginx-user && \
    chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Switch to non-root user
USER nginx-user

# Start nginx
CMD ["nginx", "-g", "daemon off;"]