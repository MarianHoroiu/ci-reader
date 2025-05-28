#!/bin/bash

# Install LLaVA Vision Model for Ollama
# This script downloads and sets up the LLaVA vision model

set -e

MODEL_NAME="llava:7b"

echo "🚀 Installing LLaVA Vision Model..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama first:"
    echo "   ollama serve"
    exit 1
fi

echo "📥 Downloading LLaVA model (this may take a while)..."
ollama pull "$MODEL_NAME"

echo "🧪 Testing LLaVA model..."
if ollama list | grep -q "$MODEL_NAME"; then
    echo "✅ LLaVA model installed successfully"
    
    # Test the model with a simple prompt
    echo "🔍 Running quick test..."
    ollama run "$MODEL_NAME" "Hello, can you see images?" --verbose
    
    echo "🎉 LLaVA Vision Model is ready!"
    echo "📝 Model: $MODEL_NAME"
    echo "🌐 You can now use it with the AI Vision OCR API"
else
    echo "❌ LLaVA model installation failed"
    exit 1
fi 