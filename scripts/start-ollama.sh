#!/bin/bash

# Start Ollama with qwen2.5vl:7b Model
# This script ensures Ollama is running with the correct model for the dev server

set -e

echo "🚀 Starting Ollama with qwen2.5vl:7b model..."

# Configuration
MODEL_NAME="qwen2.5vl:7b"
OLLAMA_PORT=11434

# Check if Ollama is already running
if curl -s http://localhost:$OLLAMA_PORT/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is already running"
else
    echo "🔄 Starting Ollama service..."
    ollama serve &
    
    # Wait for Ollama to start
    echo "⏳ Waiting for Ollama to start..."
    for i in {1..30}; do
        if curl -s http://localhost:$OLLAMA_PORT/api/tags > /dev/null 2>&1; then
            echo "✅ Ollama started successfully"
            break
        fi
        sleep 1
    done
    
    if ! curl -s http://localhost:$OLLAMA_PORT/api/tags > /dev/null 2>&1; then
        echo "❌ Failed to start Ollama"
        exit 1
    fi
fi

# Check if model is available
echo "🔍 Checking qwen2.5vl:7b model..."
if ollama list | grep -q "$MODEL_NAME"; then
    echo "✅ qwen2.5vl:7b model is available"
else
    echo "📥 Downloading qwen2.5vl:7b model..."
    ollama pull "$MODEL_NAME"
fi

# Test model
echo "🧪 Testing qwen2.5vl:7b model..."
if ollama run "$MODEL_NAME" "Hello" > /dev/null 2>&1; then
    echo "✅ qwen2.5vl:7b model is working"
else
    echo "⚠️ qwen2.5vl:7b model test failed, but continuing..."
fi

echo "🎉 Ollama is ready with qwen2.5vl:7b model!"
echo "📝 Model: $MODEL_NAME"
echo "🌐 Server: http://localhost:$OLLAMA_PORT" 