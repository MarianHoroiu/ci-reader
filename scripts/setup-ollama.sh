#!/bin/bash

# Ollama Setup Script for Romanian ID Processing PWA
# Supports macOS, Linux, and Windows (via WSL/Git Bash)
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OLLAMA_VERSION_MIN="0.7.0"
REQUIRED_RAM_GB=8
REQUIRED_DISK_GB=15
OLLAMA_PORT=11434
MODEL_NAME="llava:7b"
MODEL_DISPLAY_NAME="LLaVA"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            OS="macos"
            ;;
        Linux*)
            OS="linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            OS="windows"
            ;;
        *)
            log_error "Unsupported operating system: $(uname -s)"
            exit 1
            ;;
    esac
    log "Detected OS: $OS"
}

# Check system requirements
check_system_requirements() {
    log "Checking system requirements..."
    
    # Check available RAM
    case $OS in
        "macos")
            TOTAL_RAM_KB=$(sysctl -n hw.memsize)
            TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024 / 1024))
            ;;
        "linux")
            TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
            TOTAL_RAM_GB=$((TOTAL_RAM_KB / 1024 / 1024))
            ;;
        "windows")
            # For Windows/WSL, use a simplified check
            TOTAL_RAM_GB=8  # Assume minimum for Windows users
            log_warning "RAM check simplified for Windows. Ensure you have at least ${REQUIRED_RAM_GB}GB RAM."
            ;;
    esac
    
    if [ "$TOTAL_RAM_GB" -lt "$REQUIRED_RAM_GB" ]; then
        log_error "Insufficient RAM: ${TOTAL_RAM_GB}GB available, ${REQUIRED_RAM_GB}GB required"
        log_error "$MODEL_DISPLAY_NAME requires at least ${REQUIRED_RAM_GB}GB RAM"
        exit 1
    fi
    log_success "RAM check passed: ${TOTAL_RAM_GB}GB available"
    
    # Check available disk space
    case $OS in
        "macos"|"linux")
            AVAILABLE_DISK_GB=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
            ;;
        "windows")
            AVAILABLE_DISK_GB=20  # Assume sufficient for Windows users
            log_warning "Disk space check simplified for Windows. Ensure you have at least ${REQUIRED_DISK_GB}GB free space."
            ;;
    esac
    
    if [ "$AVAILABLE_DISK_GB" -lt "$REQUIRED_DISK_GB" ]; then
        log_error "Insufficient disk space: ${AVAILABLE_DISK_GB}GB available, ${REQUIRED_DISK_GB}GB required"
        log_error "$MODEL_DISPLAY_NAME model requires approximately ${REQUIRED_DISK_GB}GB storage"
        exit 1
    fi
    log_success "Disk space check passed: ${AVAILABLE_DISK_GB}GB available"
}

# Check if Ollama is already installed
check_existing_ollama() {
    if command -v ollama >/dev/null 2>&1; then
        CURRENT_VERSION=$(ollama --version 2>/dev/null | grep -o 'ollama version [0-9.]*' | cut -d' ' -f3 || echo "unknown")
        log "Found existing Ollama installation: version $CURRENT_VERSION"
        
        # Simple version comparison (assumes semantic versioning)
        if [ "$CURRENT_VERSION" != "unknown" ]; then
            # Convert versions to comparable numbers (e.g., 0.7.0 -> 070)
            CURRENT_NUM=$(echo "$CURRENT_VERSION" | sed 's/\.//g' | sed 's/^0*//')
            REQUIRED_NUM=$(echo "$OLLAMA_VERSION_MIN" | sed 's/\.//g' | sed 's/^0*//')
            
            if [ "$CURRENT_NUM" -ge "$REQUIRED_NUM" ]; then
                log_success "Ollama version $CURRENT_VERSION meets minimum requirement ($OLLAMA_VERSION_MIN)"
                return 0
            else
                log_warning "Ollama version $CURRENT_VERSION is below minimum requirement ($OLLAMA_VERSION_MIN)"
                log "Will proceed with installation/upgrade"
            fi
        fi
    fi
    return 1
}

# Install Ollama based on OS
install_ollama() {
    log "Installing Ollama for $OS..."
    
    case $OS in
        "macos")
            if command -v brew >/dev/null 2>&1; then
                log "Installing via Homebrew..."
                brew install ollama
            else
                log "Installing via official installer..."
                curl -fsSL https://ollama.com/install.sh | sh
            fi
            ;;
        "linux")
            log "Installing via official installer..."
            curl -fsSL https://ollama.com/install.sh | sh
            ;;
        "windows")
            log_error "Please download and install Ollama manually from: https://ollama.com/download"
            log_error "After installation, restart this script to continue with model setup"
            exit 1
            ;;
    esac
    
    log_success "Ollama installation completed"
}

# Start Ollama service
start_ollama_service() {
    log "Starting Ollama service..."
    
    case $OS in
        "macos")
            # On macOS, Ollama typically runs as a user service
            if ! pgrep -f "ollama" >/dev/null; then
                log "Starting Ollama daemon..."
                ollama serve &
                OLLAMA_PID=$!
                sleep 5
            fi
            ;;
        "linux")
            # On Linux, try to start as systemd service first
            if systemctl is-active --quiet ollama 2>/dev/null; then
                log "Ollama service is already running"
            elif command -v systemctl >/dev/null 2>&1; then
                log "Starting Ollama systemd service..."
                sudo systemctl start ollama
                sudo systemctl enable ollama
            else
                log "Starting Ollama daemon manually..."
                ollama serve &
                OLLAMA_PID=$!
                sleep 5
            fi
            ;;
        "windows")
            log "Please ensure Ollama is running. Check the system tray or start it manually."
            ;;
    esac
}

# Verify Ollama is running
verify_ollama_running() {
    log "Verifying Ollama service is running..."
    
    # Wait up to 30 seconds for Ollama to start
    for i in {1..30}; do
        if curl -s "http://localhost:$OLLAMA_PORT" >/dev/null 2>&1; then
            log_success "Ollama service is running on port $OLLAMA_PORT"
            return 0
        fi
        sleep 1
    done
    
    log_error "Ollama service is not responding on port $OLLAMA_PORT"
    log_error "Please check if Ollama is properly installed and running"
    exit 1
}

# Check GPU availability (optional)
check_gpu_support() {
    log "Checking for GPU support..."
    
    case $OS in
        "macos")
            # Check for Apple Silicon
            if sysctl -n machdep.cpu.brand_string | grep -q "Apple"; then
                log_success "Apple Silicon detected - Metal GPU acceleration available"
            else
                log_warning "Intel Mac detected - CPU-only processing"
            fi
            ;;
        "linux")
            if command -v nvidia-smi >/dev/null 2>&1; then
                GPU_INFO=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits 2>/dev/null | head -1)
                if [ -n "$GPU_INFO" ]; then
                    log_success "NVIDIA GPU detected: $GPU_INFO"
                else
                    log_warning "NVIDIA drivers found but no GPU detected"
                fi
            else
                log_warning "No NVIDIA GPU support detected - CPU-only processing"
            fi
            ;;
        "windows")
            log "GPU detection not implemented for Windows. Check manually if needed."
            ;;
    esac
}

# Main installation function
main() {
    log "Starting Ollama setup for Romanian ID Processing PWA"
    log "======================================================="
    
    # Detect OS
    detect_os
    
    # Check system requirements
    check_system_requirements
    
    # Check for existing installation
    if check_existing_ollama; then
        log "Ollama is already installed and meets requirements"
    else
        # Install Ollama
        install_ollama
    fi
    
    # Start Ollama service
    start_ollama_service
    
    # Verify service is running
    verify_ollama_running
    
    # Check GPU support
    check_gpu_support
    
    log_success "Ollama setup completed successfully!"
    log "Next steps:"
    log "1. Run './scripts/install-llava-vision.sh' to download the $MODEL_DISPLAY_NAME model"
    log "2. Check the setup documentation in 'docs/ollama-setup-guide.md'"
    log ""
    log "Ollama is running on: http://localhost:$OLLAMA_PORT"
    log "You can test it with: curl http://localhost:$OLLAMA_PORT"
}

# Run main function
main "$@" 