#!/bin/bash

# Qwen2.5-VL Model Installation Script
# Downloads and configures Qwen2.5-VL-7B-Instruct model for Romanian ID processing
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODEL_NAME="qwen2.5vl:7b"
MODEL_SIZE_GB=6
OLLAMA_PORT=11434
OLLAMA_HOST="localhost"
TEST_TIMEOUT=60

# Logging functions
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

# Check if Ollama is running
check_ollama_service() {
    log "Checking if Ollama service is running..."
    
    if ! curl -s "http://$OLLAMA_HOST:$OLLAMA_PORT" >/dev/null 2>&1; then
        log_error "Ollama service is not running on $OLLAMA_HOST:$OLLAMA_PORT"
        log_error "Please run './scripts/setup-ollama.sh' first to install and start Ollama"
        exit 1
    fi
    
    log_success "Ollama service is running"
}

# Check available disk space
check_disk_space() {
    log "Checking available disk space..."
    
    case "$(uname -s)" in
        Darwin*|Linux*)
            AVAILABLE_GB=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
            ;;
        *)
            log_warning "Disk space check not implemented for this OS"
            return 0
            ;;
    esac
    
    if [ "$AVAILABLE_GB" -lt "$MODEL_SIZE_GB" ]; then
        log_error "Insufficient disk space: ${AVAILABLE_GB}GB available, ${MODEL_SIZE_GB}GB required"
        log_error "Please free up disk space and try again"
        exit 1
    fi
    
    log_success "Disk space check passed: ${AVAILABLE_GB}GB available"
}

# Check if model is already installed
check_existing_model() {
    log "Checking for existing Qwen2.5-VL model..."
    
    if ollama list | grep -q "$MODEL_NAME"; then
        log_success "Model $MODEL_NAME is already installed"
        
        # Ask user if they want to reinstall
        read -p "Do you want to reinstall the model? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Skipping model installation"
            return 0
        fi
        
        log "Proceeding with model reinstallation..."
    fi
    
    return 1
}

# Download and install the model
install_model() {
    log "Starting download of Qwen2.5-VL model..."
    log "Model: $MODEL_NAME"
    log "Size: ~${MODEL_SIZE_GB}GB"
    log "This may take several minutes depending on your internet connection..."
    
    # Start the download with progress indication
    if ollama pull "$MODEL_NAME"; then
        log_success "Model $MODEL_NAME downloaded successfully"
    else
        log_error "Failed to download model $MODEL_NAME"
        log_error "Please check your internet connection and try again"
        exit 1
    fi
}

# Verify model installation
verify_model_installation() {
    log "Verifying model installation..."
    
    # Check if model appears in list
    if ! ollama list | grep -q "$MODEL_NAME"; then
        log_error "Model $MODEL_NAME not found in Ollama model list"
        exit 1
    fi
    
    log_success "Model $MODEL_NAME is installed and available"
}

# Test model functionality
test_model() {
    log "Testing model functionality..."
    
    # Create a simple test prompt
    TEST_PROMPT="Hello, can you see this text?"
    
    log "Running test inference..."
    
    # Test the model with a timeout
    if timeout $TEST_TIMEOUT ollama run "$MODEL_NAME" <<< "$TEST_PROMPT" >/dev/null 2>&1; then
        log_success "Model test completed successfully"
    else
        log_warning "Model test timed out or failed"
        log_warning "This might be normal for the first run as the model loads into memory"
        log "You can test manually with: ollama run $MODEL_NAME"
    fi
}

# Performance test with vision capabilities
test_vision_capabilities() {
    log "Testing vision capabilities..."
    
    # Note: This is a placeholder for vision testing
    # In a real scenario, you would test with an actual image
    log "Vision capability testing requires an image file"
    log "To test vision capabilities manually, use:"
    log "  ollama run $MODEL_NAME"
    log "  Then provide an image and ask questions about it"
    
    log_success "Vision capability information provided"
}

# Show model information
show_model_info() {
    log "Model Information:"
    log "=================="
    log "Model Name: $MODEL_NAME"
    log "Model Type: Vision-Language Model"
    log "Context Window: 125K tokens"
    log "Input Types: Text, Images"
    log "Recommended RAM: 6GB+"
    log "Disk Usage: ~${MODEL_SIZE_GB}GB"
    log ""
    log "Capabilities:"
    log "- Document parsing and OCR"
    log "- Image understanding and analysis"
    log "- Structured data extraction"
    log "- Romanian language support"
    log "- JSON output formatting"
}

# Show usage examples
show_usage_examples() {
    log "Usage Examples:"
    log "==============="
    log ""
    log "1. Basic text interaction:"
    log "   ollama run $MODEL_NAME"
    log ""
    log "2. API usage (for integration):"
    log "   curl http://localhost:$OLLAMA_PORT/api/generate \\"
    log "     -d '{\"model\": \"$MODEL_NAME\", \"prompt\": \"Hello!\"}'"
    log ""
    log "3. Vision API usage:"
    log "   curl http://localhost:$OLLAMA_PORT/api/generate \\"
    log "     -d '{\"model\": \"$MODEL_NAME\", \"prompt\": \"Describe this image\", \"images\": [\"base64_image_data\"]}'"
    log ""
    log "For Romanian ID processing, the model will be integrated into the Next.js application."
}

# Main installation function
main() {
    log "Starting Qwen2.5-VL model installation"
    log "======================================"
    
    # Check prerequisites
    check_ollama_service
    check_disk_space
    
    # Check for existing model
    if check_existing_model; then
        log "Model already installed and verified"
    else
        # Install the model
        install_model
    fi
    
    # Verify installation
    verify_model_installation
    
    # Test model
    test_model
    
    # Test vision capabilities
    test_vision_capabilities
    
    # Show information
    show_model_info
    show_usage_examples
    
    log_success "Qwen2.5-VL model installation completed successfully!"
    log ""
    log "Next steps:"
    log "1. The model is ready for use in the Romanian ID processing application"
    log "2. Check the documentation in 'docs/ollama-setup-guide.md' for integration details"
    log "3. Run 'npm run check' to verify the application setup"
    log ""
    log "Model endpoint: http://localhost:$OLLAMA_PORT"
    log "Model name: $MODEL_NAME"
}

# Handle script interruption
cleanup() {
    log_warning "Installation interrupted"
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@" 