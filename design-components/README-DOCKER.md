# Docker Setup for Storybook

This Docker setup builds and deploys Storybook as a static site served by Nginx.

## 🚀 Quick Start

### Build and Run Storybook Container

```bash
# Build the Docker image
./docker-build.sh

# Run the container
docker run -p 8080:80 revenue-os-storybook:latest

# Or use docker-compose
docker-compose up storybook-prod
```

## 📦 What Gets Built

The Docker image:
1. Builds Storybook static files using `npm run build-storybook`
2. Serves the static Storybook using Nginx
3. Optimizes for production with gzip compression and caching

## 🐳 Docker Commands

### Build Options

```bash
# Build with default 'latest' tag
./docker-build.sh

# Build with specific version tag
./docker-build.sh v1.0.0

# Build and export as tar file
./docker-build.sh latest --export
```

### Docker Compose Commands

```bash
# Run production Storybook (built static files)
docker-compose up storybook-prod

# Run development Storybook (with hot reload)
docker-compose --profile storybook-dev up

# Run app development server
docker-compose --profile development up

# Stop all containers
docker-compose down
```

## 🏗️ Architecture

### Production Build (storybook-prod)
- Multi-stage Docker build
- Stage 1: Node.js builds Storybook
- Stage 2: Nginx serves static files
- Optimized for small image size (~50MB)
- Security hardened with non-root user

### Development Mode (storybook-dev)
- Mounts source code as volume
- Hot reload enabled
- Runs on port 6006
- No build step required

## 🔧 Configuration

### Nginx Features
- Gzip compression enabled
- Static asset caching (1 year)
- Security headers configured
- Health check endpoint at `/health`
- Storybook-specific routing

### Ports
- Production: `8080` (Nginx)
- Development: `6006` (Storybook dev server)

## 🚢 Deployment

### Push to Registry

```bash
# Set registry URL
export DOCKER_REGISTRY=your-registry.com

# Build and tag
./docker-build.sh

# Push to registry
docker push your-registry.com/revenue-os-storybook:latest
```

### Deploy to Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: storybook
spec:
  replicas: 2
  selector:
    matchLabels:
      app: storybook
  template:
    metadata:
      labels:
        app: storybook
    spec:
      containers:
      - name: storybook
        image: revenue-os-storybook:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 📊 Image Size

- Base image: ~10MB (nginx:alpine)
- Storybook assets: ~30-40MB
- Total image: ~50MB

## 🔒 Security

- Non-root user execution
- Security headers configured
- No unnecessary packages
- Alpine Linux base for minimal attack surface