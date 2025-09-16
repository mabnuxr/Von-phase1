#!/bin/bash

# Docker build script for Revenue OS Frontend Design Components

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="revenue-os-storybook"
IMAGE_TAG="${1:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
REGISTRY_URL="${DOCKER_REGISTRY:-}"  # Optional registry URL from environment

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message "$RED" "❌ Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_message "$GREEN" "✅ Docker is running"
}

# Function to build the Docker image
build_image() {
    print_message "$YELLOW" "🔨 Building Docker image: ${FULL_IMAGE_NAME}"
    
    # Build with buildkit for better performance
    DOCKER_BUILDKIT=1 docker build \
        --build-arg NODE_ENV=production \
        --tag "${FULL_IMAGE_NAME}" \
        --file Dockerfile \
        --no-cache \
        .
    
    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✅ Successfully built: ${FULL_IMAGE_NAME}"
    else
        print_message "$RED" "❌ Build failed"
        exit 1
    fi
}

# Function to tag image for registry
tag_for_registry() {
    if [ -n "$REGISTRY_URL" ]; then
        local registry_image="${REGISTRY_URL}/${FULL_IMAGE_NAME}"
        print_message "$YELLOW" "🏷️  Tagging image for registry: ${registry_image}"
        docker tag "${FULL_IMAGE_NAME}" "${registry_image}"
        print_message "$GREEN" "✅ Tagged as: ${registry_image}"
    fi
}

# Function to show image information
show_image_info() {
    print_message "$YELLOW" "📊 Image Information:"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# Function to run security scan (if trivy is installed)
security_scan() {
    if command -v trivy &> /dev/null; then
        print_message "$YELLOW" "🔍 Running security scan with Trivy..."
        trivy image --severity HIGH,CRITICAL "${FULL_IMAGE_NAME}"
    else
        print_message "$YELLOW" "ℹ️  Trivy not installed. Skipping security scan."
        print_message "$YELLOW" "   Install with: brew install trivy"
    fi
}

# Function to export image as tar (optional)
export_image() {
    if [ "$2" == "--export" ]; then
        local export_file="${IMAGE_NAME}-${IMAGE_TAG}.tar"
        print_message "$YELLOW" "📦 Exporting image to ${export_file}..."
        docker save -o "${export_file}" "${FULL_IMAGE_NAME}"
        print_message "$GREEN" "✅ Image exported to ${export_file}"
        ls -lh "${export_file}"
    fi
}

# Main execution
main() {
    print_message "$GREEN" "========================================="
    print_message "$GREEN" "   Docker Build Script for Storybook"
    print_message "$GREEN" "========================================="
    echo ""
    
    # Check prerequisites
    check_docker
    
    # Build the image
    build_image
    
    # Tag for registry if configured
    tag_for_registry
    
    # Show image information
    show_image_info
    
    # Run security scan
    security_scan
    
    # Export if requested
    export_image "$@"
    
    echo ""
    print_message "$GREEN" "========================================="
    print_message "$GREEN" "✅ Build process completed successfully!"
    print_message "$GREEN" "========================================="
    echo ""
    print_message "$YELLOW" "📝 Next steps:"
    print_message "$YELLOW" "   - Run container: docker run -p 8080:80 ${FULL_IMAGE_NAME}"
    print_message "$YELLOW" "   - Push to registry: docker push ${REGISTRY_URL}/${FULL_IMAGE_NAME}"
    print_message "$YELLOW" "   - Use docker-compose: docker-compose up"
}

# Run the main function
main "$@"