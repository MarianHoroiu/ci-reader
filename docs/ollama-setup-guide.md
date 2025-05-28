# Ollama and Qwen2.5-VL Setup Guide

## Overview

This guide provides comprehensive instructions for setting up Ollama with the Qwen2.5-VL-7B-Instruct
model for the Romanian ID Processing PWA. The setup ensures complete local processing for maximum
privacy and GDPR compliance.

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Setup](#quick-setup)
- [Manual Installation](#manual-installation)
- [Model Information](#model-information)
- [Integration with Next.js](#integration-with-nextjs)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)

## System Requirements

### Minimum Requirements

- **RAM**: 6GB available memory
- **Storage**: 12GB free disk space
- **Network**: Stable internet connection for initial download
- **OS**: macOS 10.15+, Linux (Ubuntu 18.04+), Windows 10+

### Recommended Requirements

- **RAM**: 8GB+ for optimal performance
- **Storage**: 20GB+ free disk space
- **CPU**: Multi-core processor (4+ cores)
- **GPU**: Optional but recommended for faster processing
  - NVIDIA GPU with CUDA support (Linux)
  - Apple Silicon (macOS)

### Supported Operating Systems

| OS      | Version                              | Installation Method            |
| ------- | ------------------------------------ | ------------------------------ |
| macOS   | 10.15+                               | Homebrew or Official Installer |
| Linux   | Ubuntu 18.04+, CentOS 7+, Debian 10+ | Official Installer             |
| Windows | 10+                                  | Manual Download                |

## Quick Setup

### Automated Installation

1. **Install Ollama**:

   ```bash
   chmod +x scripts/setup-ollama.sh
   ./scripts/setup-ollama.sh
   ```

2. **Install Qwen2.5-VL Model**:

   ```bash
   chmod +x scripts/install-qwen-vision.sh
   ./scripts/install-qwen-vision.sh
   ```

3. **Verify Installation**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Expected Output

After successful installation, you should see:

- Ollama service running on `localhost:11434`
- Qwen2.5-VL model available in model list
- Model responding to test queries

## Manual Installation

### Step 1: Install Ollama

#### macOS

```bash
# Using Homebrew (recommended)
brew install ollama

# Or using official installer
curl -fsSL https://ollama.com/install.sh | sh
```

#### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows

1. Download from [ollama.com/download](https://ollama.com/download)
2. Run the installer
3. Restart your terminal

### Step 2: Start Ollama Service

#### macOS/Linux

```bash
# Start as background service
ollama serve &

# Or start as systemd service (Linux)
sudo systemctl start ollama
sudo systemctl enable ollama
```

#### Windows

Ollama starts automatically after installation.

### Step 3: Download Qwen2.5-VL Model

```bash
# Download the 7B model (~6GB)
ollama pull qwen2.5vl:7b

# Alternative sizes available:
# ollama pull qwen2.5vl:3b    # ~3.2GB
# ollama pull qwen2.5vl:32b   # ~21GB
# ollama pull qwen2.5vl:72b   # ~49GB
```

### Step 4: Verify Installation

```bash
# List installed models
ollama list

# Test the model
ollama run qwen2.5vl:7b
```

## Model Information

### Qwen2.5-VL-7B-Instruct Specifications

| Specification      | Value                            |
| ------------------ | -------------------------------- |
| **Model Size**     | 7 Billion parameters             |
| **Download Size**  | ~6GB                             |
| **Memory Usage**   | 6-8GB RAM                        |
| **Context Window** | 125K tokens                      |
| **Input Types**    | Text, Images                     |
| **Output Types**   | Text, JSON                       |
| **Languages**      | 29+ languages including Romanian |

### Key Capabilities

- **Document Parsing**: Advanced OCR and layout understanding
- **Image Analysis**: Object detection, scene understanding
- **Structured Output**: JSON formatting for data extraction
- **Romanian Language**: Native support for Romanian text
- **Vision-Language**: Combined text and image processing

### Model Variants

| Model           | Size  | RAM Required | Use Case                       |
| --------------- | ----- | ------------ | ------------------------------ |
| `qwen2.5vl:3b`  | 3.2GB | 4GB+         | Edge devices, testing          |
| `qwen2.5vl:7b`  | 6.0GB | 6GB+         | **Recommended for production** |
| `qwen2.5vl:32b` | 21GB  | 24GB+        | High accuracy requirements     |
| `qwen2.5vl:72b` | 49GB  | 64GB+        | Maximum performance            |

## Integration with Next.js

### Environment Configuration

Create or update your `.env.local` file:

```env
# Ollama Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=qwen2.5vl:7b

# AI Processing Settings
AI_PROCESSING_TIMEOUT=30000
AI_MAX_IMAGE_SIZE=10485760
AI_SUPPORTED_FORMATS=jpg,jpeg,png,webp
```

### API Client Setup

The Ollama client will be available at:

- **Endpoint**: `http://localhost:11434`
- **Model Name**: `qwen2.5vl:7b`
- **API Documentation**:
  [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)

### Health Check Endpoint

Test the integration:

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5vl:7b",
    "prompt": "Hello, are you working?",
    "stream": false
  }'
```

## Testing and Verification

### Basic Functionality Test

```bash
# Test text processing
echo "Describe the capabilities of Qwen2.5-VL" | ollama run qwen2.5vl:7b

# Test model listing
ollama list | grep qwen2.5vl
```

### Vision Capabilities Test

```bash
# Test with image (requires image file)
ollama run qwen2.5vl:7b "Describe this image" < image.jpg
```

### API Integration Test

```bash
# Test API endpoint
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5vl:7b",
    "prompt": "Extract text from Romanian ID document",
    "stream": false
  }'
```

### Performance Benchmark

```bash
# Measure response time
time curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5vl:7b",
    "prompt": "Quick test",
    "stream": false
  }'
```

## Troubleshooting

### Common Issues

#### 1. Ollama Service Not Starting

**Symptoms**: Connection refused on port 11434

**Solutions**:

```bash
# Check if service is running
ps aux | grep ollama

# Restart service (macOS/Linux)
killall ollama
ollama serve &

# Check port availability
lsof -i :11434
```

#### 2. Model Download Fails

**Symptoms**: Network errors during `ollama pull`

**Solutions**:

```bash
# Check internet connection
curl -I https://ollama.com

# Retry with verbose output
ollama pull qwen2.5vl:7b --verbose

# Clear cache and retry
rm -rf ~/.ollama/models/qwen2.5vl*
ollama pull qwen2.5vl:7b
```

#### 3. Insufficient Memory

**Symptoms**: Model fails to load or crashes

**Solutions**:

```bash
# Check available memory
free -h  # Linux
vm_stat  # macOS

# Use smaller model
ollama pull qwen2.5vl:3b

# Close other applications
# Increase swap space (Linux)
```

#### 4. Slow Performance

**Symptoms**: Long response times

**Solutions**:

```bash
# Check CPU usage
top

# Monitor GPU usage (if available)
nvidia-smi  # NVIDIA
ioreg -l | grep -i metal  # macOS

# Optimize model parameters
# Use smaller context window
# Enable GPU acceleration
```

### Error Codes

| Error Code           | Description                | Solution                            |
| -------------------- | -------------------------- | ----------------------------------- |
| `connection refused` | Ollama service not running | Start ollama service                |
| `model not found`    | Model not downloaded       | Run `ollama pull qwen2.5vl:7b`      |
| `out of memory`      | Insufficient RAM           | Use smaller model or add RAM        |
| `timeout`            | Request took too long      | Increase timeout or check resources |

### Log Files

#### macOS

```bash
# Ollama logs
tail -f ~/Library/Logs/Ollama/server.log

# System logs
log show --predicate 'process == "ollama"' --last 1h
```

#### Linux

```bash
# Systemd logs
journalctl -u ollama -f

# Manual service logs
tail -f ~/.ollama/logs/server.log
```

#### Windows

```bash
# Check Windows Event Viewer
# Or check Ollama installation directory logs
```

## Performance Optimization

### Memory Optimization

```bash
# Set memory limits
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_MAX_QUEUE=512

# Optimize for low memory
export OLLAMA_NUM_PARALLEL=1
```

### GPU Acceleration

#### NVIDIA (Linux)

```bash
# Verify CUDA installation
nvidia-smi

# Set GPU memory fraction
export CUDA_VISIBLE_DEVICES=0
```

#### Apple Silicon (macOS)

```bash
# Metal acceleration is automatic
# Monitor with Activity Monitor
```

### Network Optimization

```bash
# Set connection timeouts
export OLLAMA_KEEP_ALIVE=5m
export OLLAMA_REQUEST_TIMEOUT=30s

# Configure concurrent requests
export OLLAMA_MAX_QUEUE=10
```

## Security Considerations

### Local Processing Benefits

- **Zero Data Transmission**: All processing happens locally
- **GDPR Compliance**: No external data sharing
- **Privacy Protection**: Sensitive documents never leave your system
- **Air-Gapped Operation**: Can work without internet after setup

### Network Security

```bash
# Bind to localhost only (default)
export OLLAMA_HOST=127.0.0.1:11434

# Enable HTTPS (if needed)
export OLLAMA_CERT_FILE=/path/to/cert.pem
export OLLAMA_KEY_FILE=/path/to/key.pem
```

### Access Control

```bash
# Restrict file permissions
chmod 600 ~/.ollama/config.json

# Monitor access logs
tail -f ~/.ollama/logs/access.log
```

### Data Protection

- Models are stored locally in `~/.ollama/models/`
- No telemetry or usage data is sent to external servers
- All processing is contained within your local environment

## Advanced Configuration

### Custom Model Parameters

```json
{
  "model": "qwen2.5vl:7b",
  "options": {
    "temperature": 0.1,
    "top_p": 0.9,
    "max_tokens": 2048,
    "stop": ["</response>"]
  }
}
```

### Batch Processing

```bash
# Process multiple requests
for file in *.jpg; do
  ollama run qwen2.5vl:7b "Analyze this image" < "$file"
done
```

### Model Customization

```bash
# Create custom model with specific parameters
ollama create romanian-id-processor -f Modelfile
```

## Support and Resources

### Documentation Links

- [Ollama Official Documentation](https://github.com/ollama/ollama)
- [Qwen2.5-VL Model Card](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct)
- [API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)

### Community Resources

- [Ollama Discord](https://discord.gg/ollama)
- [GitHub Issues](https://github.com/ollama/ollama/issues)
- [Model Hub](https://ollama.com/library)

### Getting Help

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Create a new issue with:
   - System information
   - Error messages
   - Steps to reproduce
   - Log files

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Compatibility**: Ollama 0.7.0+, Qwen2.5-VL models
