#!/bin/bash

# Dropstone Update Server Deployment Script
# This script helps deploy the update server to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Check if Node.js is installed (for development)
check_node() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. This is only needed for development."
        return 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js version is below 18. Recommended version is 18 or higher."
        return 1
    fi

    print_success "Node.js is available"
    return 0
}

# Setup environment
setup_env() {
    print_status "Setting up environment..."

    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Created .env file from template"
    else
        print_warning ".env file already exists"
    fi

    # Create necessary directories
    mkdir -p data downloads uploads public
    print_success "Created necessary directories"
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."

    if check_node; then
        npm install
        print_success "Dependencies installed"
    else
        print_warning "Skipping npm install (Node.js not available)"
    fi
}

# Build Docker image
build_docker() {
    print_status "Building Docker image..."
    docker-compose build
    print_success "Docker image built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    docker-compose up -d
    print_success "Services started successfully"
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped successfully"
}

# Show logs
show_logs() {
    print_status "Showing logs..."
    docker-compose logs -f
}

# Show status
show_status() {
    print_status "Service status:"
    docker-compose ps

    print_status "Health check:"
    curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health
}

# Development mode
dev_mode() {
    print_status "Starting in development mode..."

    if ! check_node; then
        print_error "Node.js is required for development mode"
        exit 1
    fi

    npm run dev
}

# Production mode with nginx
prod_mode() {
    print_status "Starting in production mode with nginx..."
    docker-compose --profile production up -d
    print_success "Production services started"
}

# Upload sample version
upload_sample() {
    print_status "Creating sample version upload..."

    # Create a sample tar.gz file
    mkdir -p temp/sample
    echo "This is a sample PearAI server" > temp/sample/README.txt
    echo "Version: 1.0.0" >> temp/sample/README.txt

    cd temp
    tar -czf sample-server-linux-x64.tar.gz sample/
    cd ..

    # Upload using curl
    curl -X POST http://localhost:3000/admin/upload \
        -F "file=@temp/sample-server-linux-x64.tar.gz" \
        -F "platform=server-linux-x64" \
        -F "quality=stable" \
        -F "version=1.0.0" \
        -F "name=PearAI 1.0.0 Sample"

    # Cleanup
    rm -rf temp/

    print_success "Sample version uploaded"
}

# Main function
main() {
    case "${1:-help}" in
        "setup")
            check_docker
            setup_env
            install_deps
            print_success "Setup completed successfully"
            ;;
        "start")
            check_docker
            build_docker
            start_services
            print_success "Services started. Access at http://localhost:3000"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            start_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "dev")
            dev_mode
            ;;
        "prod")
            check_docker
            prod_mode
            ;;
        "upload-sample")
            upload_sample
            ;;
        "clean")
            print_status "Cleaning up..."
            docker-compose down -v
            docker system prune -f
            print_success "Cleanup completed"
            ;;
        "help"|*)
            echo "Dropstone Update Server Deployment Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  setup         - Initial setup (creates .env, installs deps)"
            echo "  start         - Start services using Docker"
            echo "  stop          - Stop services"
            echo "  restart       - Restart services"
            echo "  logs          - Show service logs"
            echo "  status        - Show service status and health"
            echo "  dev           - Start in development mode (requires Node.js)"
            echo "  prod          - Start in production mode with nginx"
            echo "  upload-sample - Upload a sample version for testing"
            echo "  clean         - Clean up Docker resources"
            echo "  help          - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 setup      # Initial setup"
            echo "  $0 start      # Start the server"
            echo "  $0 dev        # Development mode"
            echo "  $0 status     # Check status"
            ;;
    esac
}

# Run main function
main "$@"
