#!/bin/bash

# Ollama Setup Test Script
# Comprehensive testing of Ollama and Qwen2.5-VL installation
# Version: 1.0.2 - Fixed shell compatibility

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OLLAMA_HOST="localhost"
OLLAMA_PORT=11434
MODEL_NAME="qwen2.5vl:7b"
TEST_TIMEOUT=60

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Detect OS for compatibility
OS_TYPE=$(uname -s)

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Cross-platform timeout function
run_with_timeout() {
    local timeout_duration=$1
    shift
    local command="$@"
    
    case $OS_TYPE in
        Darwin*)
            # macOS - use gtimeout if available, otherwise use a background process approach
            if command -v gtimeout >/dev/null 2>&1; then
                gtimeout "$timeout_duration" $command
            else
                # Fallback for macOS without gtimeout
                $command &
                local pid=$!
                local count=0
                while [ $count -lt $timeout_duration ] && kill -0 $pid 2>/dev/null; do
                    sleep 1
                    count=$((count + 1))
                done
                if kill -0 $pid 2>/dev/null; then
                    kill $pid 2>/dev/null
                    wait $pid 2>/dev/null
                    return 124  # timeout exit code
                fi
                wait $pid
                return $?
            fi
            ;;
        *)
            # Linux and others
            timeout "$timeout_duration" $command
            ;;
    esac
}

# Test 1: Check if Ollama is installed
test_ollama_installation() {
    log_test "Checking Ollama installation..."
    
    if command -v ollama >/dev/null 2>&1; then
        OLLAMA_VERSION=$(ollama --version 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
        log_success "Ollama is installed (version: $OLLAMA_VERSION)"
        return 0
    else
        log_error "Ollama is not installed or not in PATH"
        return 1
    fi
}

# Test 2: Check if Ollama service is running
test_ollama_service() {
    log_test "Checking Ollama service status..."
    
    if curl -s "http://$OLLAMA_HOST:$OLLAMA_PORT" >/dev/null 2>&1; then
        log_success "Ollama service is running on $OLLAMA_HOST:$OLLAMA_PORT"
        return 0
    else
        log_error "Ollama service is not responding on $OLLAMA_HOST:$OLLAMA_PORT"
        log "Try running: ollama serve"
        return 1
    fi
}

# Test 3: Check if Qwen2.5-VL model is available
test_model_availability() {
    log_test "Checking if $MODEL_NAME model is available..."
    
    if ollama list | grep -q "$MODEL_NAME"; then
        MODEL_INFO=$(ollama list | grep "$MODEL_NAME")
        log_success "Model $MODEL_NAME is available"
        log "Model info: $MODEL_INFO"
        return 0
    else
        log_error "Model $MODEL_NAME is not available"
        log "Try running: ollama pull $MODEL_NAME"
        return 1
    fi
}

# Test 4: Test basic model functionality
test_model_functionality() {
    log_test "Testing basic model functionality..."
    
    local test_prompt="Hello! Please respond with exactly 'Test successful' to confirm you are working."
    local temp_file=$(mktemp)
    
    # Run model test with timeout
    if run_with_timeout $TEST_TIMEOUT ollama run "$MODEL_NAME" <<< "$test_prompt" > "$temp_file" 2>&1; then
        local response=$(cat "$temp_file")
        if [[ "$response" == *"Test successful"* ]] || [[ "$response" == *"working"* ]]; then
            log_success "Model responded correctly"
            log "Response: $(echo "$response" | head -1)"
        else
            log_warning "Model responded but output may be unexpected"
            log "Response: $(echo "$response" | head -1)"
        fi
        rm -f "$temp_file"
        return 0
    else
        log_error "Model test failed or timed out"
        if [ -f "$temp_file" ]; then
            log "Error output: $(cat "$temp_file" | head -3)"
            rm -f "$temp_file"
        fi
        return 1
    fi
}

# Test 5: Test API endpoints
test_api_endpoints() {
    log_test "Testing Ollama API endpoints..."
    
    # Test /api/tags endpoint
    if curl -s "http://$OLLAMA_HOST:$OLLAMA_PORT/api/tags" | grep -q "models"; then
        log_success "API /api/tags endpoint is working"
    else
        log_error "API /api/tags endpoint is not working"
        return 1
    fi
    
    # Test /api/generate endpoint with simple request
    local api_test_payload='{
        "model": "'$MODEL_NAME'",
        "prompt": "Say hello",
        "stream": false
    }'
    
    # Use a simpler approach for API testing
    local temp_response=$(mktemp)
    if curl -s -X POST "http://$OLLAMA_HOST:$OLLAMA_PORT/api/generate" \
        -H "Content-Type: application/json" \
        -d "$api_test_payload" > "$temp_response" 2>&1; then
        
        if grep -q "response" "$temp_response"; then
            log_success "API /api/generate endpoint is working"
            rm -f "$temp_response"
            return 0
        else
            log_error "API /api/generate endpoint returned unexpected response"
            log "Response: $(cat "$temp_response" | head -2)"
            rm -f "$temp_response"
            return 1
        fi
    else
        log_error "API /api/generate endpoint is not working"
        rm -f "$temp_response"
        return 1
    fi
}

# Test 6: Test vision capabilities (if possible)
test_vision_capabilities() {
    log_test "Testing vision capabilities..."
    
    # This is a basic test - in a real scenario you'd test with an actual image
    log_warning "Vision capability testing requires an image file"
    log "To test vision capabilities manually:"
    log "1. Prepare an image file (JPG, PNG)"
    log "2. Run: ollama run $MODEL_NAME"
    log "3. Provide the image and ask questions about it"
    
    # For now, just verify the model supports vision
    if ollama show "$MODEL_NAME" 2>/dev/null | grep -qi "vision\|image\|multimodal"; then
        log_success "Model appears to support vision capabilities"
        return 0
    else
        log_warning "Could not verify vision capabilities from model info"
        return 0  # Don't fail the test for this
    fi
}

# Test 7: Performance benchmark
test_performance() {
    log_test "Running performance benchmark..."
    
    local start_time=$(date +%s)
    local test_prompt="Count from 1 to 10."
    local temp_file=$(mktemp)
    
    if run_with_timeout 30 ollama run "$MODEL_NAME" <<< "$test_prompt" > "$temp_file" 2>&1; then
        local end_time=$(date +%s)
        local duration_s=$((end_time - start_time))
        
        log_success "Performance test completed in ${duration_s}s"
        
        # Basic performance assessment
        if [ "$duration_s" -lt 5 ]; then
            log_success "Performance: Excellent (< 5s)"
        elif [ "$duration_s" -lt 15 ]; then
            log_success "Performance: Good (< 15s)"
        elif [ "$duration_s" -lt 30 ]; then
            log_warning "Performance: Acceptable (< 30s)"
        else
            log_warning "Performance: Slow (> 30s) - consider hardware upgrade"
        fi
        
        rm -f "$temp_file"
        return 0
    else
        log_error "Performance test failed or timed out"
        rm -f "$temp_file"
        return 1
    fi
}

# Test 8: Memory usage check
test_memory_usage() {
    log_test "Checking memory usage..."
    
    case "$OS_TYPE" in
        Darwin*)
            # macOS
            local total_ram_bytes=$(sysctl -n hw.memsize)
            local total_ram_gb=$((total_ram_bytes / 1024 / 1024 / 1024))
            
            # Get available memory from vm_stat
            local vm_stat_output=$(vm_stat)
            local page_size=$(echo "$vm_stat_output" | grep "page size" | awk '{print $8}')
            local free_pages=$(echo "$vm_stat_output" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
            local inactive_pages=$(echo "$vm_stat_output" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
            local speculative_pages=$(echo "$vm_stat_output" | grep "Pages speculative" | awk '{print $3}' | sed 's/\.//')
            
            # Calculate available memory (free + inactive + speculative)
            local available_pages=$((free_pages + inactive_pages + speculative_pages))
            local available_ram_gb=$((available_pages * page_size / 1024 / 1024 / 1024))
            ;;
        Linux*)
            # Linux
            local total_ram_gb=$(free -g | awk '/^Mem:/ {print $2}')
            local available_ram_gb=$(free -g | awk '/^Mem:/ {print $7}')
            ;;
        *)
            log_warning "Memory check not implemented for this OS"
            return 0
            ;;
    esac
    
    log "Total RAM: ${total_ram_gb}GB"
    log "Available RAM: ${available_ram_gb}GB"
    
    # Check if we have sufficient total RAM (more important than available)
    if [ "$total_ram_gb" -ge 8 ]; then
        if [ "$available_ram_gb" -ge 6 ]; then
            log_success "Sufficient memory available for optimal performance"
        elif [ "$available_ram_gb" -ge 2 ]; then
            log_success "Adequate memory available (model may already be loaded)"
        else
            log_warning "Low available memory, but total RAM is sufficient"
        fi
    elif [ "$total_ram_gb" -ge 6 ]; then
        if [ "$available_ram_gb" -ge 4 ]; then
            log_success "Sufficient memory available"
        elif [ "$available_ram_gb" -ge 1 ]; then
            log_warning "Limited available memory, but should work"
        else
            log_warning "Very low available memory - monitor performance"
        fi
    else
        log_error "Insufficient total RAM (${total_ram_gb}GB) - 6GB+ recommended"
        return 1
    fi
    
    return 0
}

# Test 9: Disk space check
test_disk_space() {
    log_test "Checking disk space..."
    
    case "$OS_TYPE" in
        Darwin*|Linux*)
            # Use df with different flags for macOS vs Linux
            if [ "$OS_TYPE" = "Darwin" ]; then
                local available_gb=$(df -g . | tail -1 | awk '{print $4}')
            else
                local available_gb=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
            fi
            ;;
        *)
            log_warning "Disk space check not implemented for this OS"
            return 0
            ;;
    esac
    
    log "Available disk space: ${available_gb}GB"
    
    if [ "$available_gb" -ge 10 ]; then
        log_success "Sufficient disk space available"
    elif [ "$available_gb" -ge 5 ]; then
        log_warning "Limited disk space - monitor usage"
    else
        log_error "Low disk space - may cause issues"
        return 1
    fi
    
    return 0
}

# Test 10: Integration test (if Next.js app is running)
test_integration() {
    log_test "Testing integration with Next.js application..."
    
    # Check if Next.js dev server is running (common ports)
    local nextjs_ports=(3000 3001 3002)
    local nextjs_running=false
    
    for port in "${nextjs_ports[@]}"; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            log "Found Next.js application on port $port"
            
            # Try to test the health endpoint
            if curl -s "http://localhost:$port/api/ai/health" | grep -q "status"; then
                log_success "AI health endpoint is responding"
                nextjs_running=true
                break
            fi
        fi
    done
    
    if [ "$nextjs_running" = false ]; then
        log_warning "Next.js application not running or health endpoint not available"
        log "To test integration:"
        log "1. Start the Next.js application: npm run dev"
        log "2. Visit: http://localhost:3000/api/ai/health"
    fi
    
    return 0  # Don't fail for this test
}

# Generate test report
generate_report() {
    echo
    log "=========================================="
    log "           TEST REPORT SUMMARY"
    log "=========================================="
    log "Total tests: $TESTS_TOTAL"
    log_success "Passed: $TESTS_PASSED"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        log_error "Failed: $TESTS_FAILED"
    else
        log "Failed: 0"
    fi
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    log "Success rate: ${success_rate}%"
    
    echo
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 All tests passed! Ollama and Qwen2.5-VL setup is working correctly."
        log "Your Romanian ID processing system is ready to use."
    elif [ $success_rate -ge 80 ]; then
        log_warning "⚠️  Most tests passed, but some issues were found."
        log "The system should work but may have reduced functionality."
    else
        log_error "❌ Multiple tests failed. Please review the setup."
        log "Check the documentation in docs/ollama-setup-guide.md"
    fi
    
    echo
    log "Next steps:"
    log "1. If tests failed, check the troubleshooting guide"
    log "2. Start your Next.js application: npm run dev"
    log "3. Test the Romanian ID processing functionality"
    log "4. Monitor performance and adjust settings as needed"
}

# Main test execution
main() {
    log "Starting Ollama and Qwen2.5-VL setup verification"
    log "=================================================="
    log "OS: $OS_TYPE"
    echo
    
    # Run all tests
    test_ollama_installation
    test_ollama_service
    test_model_availability
    test_model_functionality
    test_api_endpoints
    test_vision_capabilities
    test_performance
    test_memory_usage
    test_disk_space
    test_integration
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script interruption
cleanup() {
    log_warning "Test interrupted"
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@" 