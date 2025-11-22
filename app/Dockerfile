# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_SCALEKIT_CLIENT_ID
ARG VITE_SCALEKIT_AUTH_BASE_URL
ARG VITE_LAUNCHDARKLY_CLIENT_ID
ARG VITE_PUSHER_KEY
ARG VITE_PUSHER_CLUSTER
ARG VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=/oauth/authorize
ARG VITE_SCALEKIT_AUTH_TOKEN_PATH=/oauth/token
ARG VITE_SCALEKIT_AUTH_LOGOUT_PATH=
ARG VITE_SCALEKIT_REDIRECT_URI=https://app.vonlabs.ai/callback
ARG VITE_API_BASE_URL=https://apiv2.vonlabs.ai
ARG VITE_PUSHER_AUTH_ENDPOINT=https://apiv2.vonlabs.ai/api/v1/pusher/auth

# Set environment variables for build
ENV VITE_SCALEKIT_CLIENT_ID=$VITE_SCALEKIT_CLIENT_ID
ENV VITE_SCALEKIT_AUTH_BASE_URL=$VITE_SCALEKIT_AUTH_BASE_URL
ENV VITE_LAUNCHDARKLY_CLIENT_ID=$VITE_LAUNCHDARKLY_CLIENT_ID
ENV VITE_PUSHER_KEY=$VITE_PUSHER_KEY
ENV VITE_PUSHER_CLUSTER=$VITE_PUSHER_CLUSTER
ENV VITE_SCALEKIT_AUTH_AUTHORIZE_PATH=$VITE_SCALEKIT_AUTH_AUTHORIZE_PATH
ENV VITE_SCALEKIT_AUTH_TOKEN_PATH=$VITE_SCALEKIT_AUTH_TOKEN_PATH
ENV VITE_SCALEKIT_AUTH_LOGOUT_PATH=$VITE_SCALEKIT_AUTH_LOGOUT_PATH
ENV VITE_SCALEKIT_REDIRECT_URI=$VITE_SCALEKIT_REDIRECT_URI
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PUSHER_AUTH_ENDPOINT=$VITE_PUSHER_AUTH_ENDPOINT

# Copy package files
COPY package*.json ./
COPY app/package*.json ./app/
COPY design-components/package*.json ./design-components/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build design-components first, then app
RUN npm run build:design && npm run build:app

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/app/dist /usr/share/nginx/html

# Use non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
