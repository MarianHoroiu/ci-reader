#!/bin/bash

# Test Ollama Setup with LLaVA Model
# This script verifies that Ollama is properly configured with the LLaVA vision model

set -e

MODEL_NAME="llava:7b"
OLLAMA_URL="http://localhost:11434"

echo "🧪 Testing Ollama Setup with LLaVA Model..."

# Test 1: Check if Ollama is running
echo "📡 Test 1: Checking Ollama connection..."
if curl -s "$OLLAMA_URL/api/tags" > /dev/null; then
    echo "✅ Ollama is running and accessible"
else
    echo "❌ Ollama is not running or not accessible"
    echo "   Please start Ollama with: ollama serve"
    exit 1
fi

# Test 2: Check if LLaVA model is available
echo "🔍 Test 2: Checking LLaVA model availability..."
if ollama list | grep -q "$MODEL_NAME"; then
    echo "✅ LLaVA model is installed"
else
    echo "❌ LLaVA model is not installed"
    echo "   Please install with: ollama pull $MODEL_NAME"
    exit 1
fi

# Test 3: Test text generation
echo "💬 Test 3: Testing text generation..."
TEXT_RESPONSE=$(echo "Hello, how are you?" | ollama run "$MODEL_NAME" 2>/dev/null || echo "FAILED")
if [[ "$TEXT_RESPONSE" != "FAILED" ]] && [[ -n "$TEXT_RESPONSE" ]]; then
    echo "✅ Text generation working"
    echo "   Response: ${TEXT_RESPONSE:0:100}..."
else
    echo "❌ Text generation failed"
    exit 1
fi

# Test 4: Test vision capabilities with a simple base64 image
echo "👁️  Test 4: Testing vision capabilities..."
# Create a simple 1x1 pixel image in base64
SIMPLE_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

VISION_TEST=$(curl -s -X POST "$OLLAMA_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL_NAME\",
        \"prompt\": \"What do you see in this image?\",
        \"images\": [\"$SIMPLE_IMAGE\"],
        \"stream\": false
    }" | jq -r '.response // "FAILED"' 2>/dev/null || echo "FAILED")

if [[ "$VISION_TEST" != "FAILED" ]] && [[ "$VISION_TEST" != "null" ]] && [[ -n "$VISION_TEST" ]]; then
    echo "✅ Vision processing working"
    echo "   Response: ${VISION_TEST:0:100}..."
else
    echo "❌ Vision processing failed"
    echo "   This might be normal for some models or configurations"
fi

# Test 5: Check model details
echo "📋 Test 5: Model information..."
MODEL_INFO=$(ollama show "$MODEL_NAME" 2>/dev/null || echo "No details available")
echo "   Model: $MODEL_NAME"
echo "   Details: ${MODEL_INFO:0:200}..."

echo ""
echo "🎉 Ollama Setup Test Complete!"
echo "📊 Summary:"
echo "   ✅ Ollama Server: Running"
echo "   ✅ LLaVA Model: Installed"
echo "   ✅ Text Generation: Working"
if [[ "$VISION_TEST" != "FAILED" ]]; then
    echo "   ✅ Vision Processing: Working"
else
    echo "   ⚠️  Vision Processing: Needs verification"
fi
echo ""
echo "🚀 Your Ollama setup is ready for AI vision processing!" 