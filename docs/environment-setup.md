# Environment Configuration

## Overview

This document describes the environment variables needed for the Romanian ID Processing PWA with
Ollama and Qwen2.5-VL integration.

## Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```bash
# Ollama Configuration for Romanian ID Processing PWA
# Copy this content to .env.local and adjust settings as needed

# Ollama Service Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=qwen2.5vl:7b

# AI Processing Configuration
AI_PROCESSING_TIMEOUT=30000
AI_MAX_RETRIES=3
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=2048
AI_CONTEXT_SIZE=4096

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="Romanian ID Processor"
NEXT_PUBLIC_APP_VERSION=1.0.0

# Security Configuration (for production)
# ALLOWED_ORIGINS=https://yourdomain.com
# API_RATE_LIMIT=100
# ENABLE_CORS=false

# Logging Configuration
LOG_LEVEL=info
ENABLE_AI_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true

# Feature Flags
ENABLE_HEALTH_CHECKS=true
ENABLE_MODEL_CACHING=true
ENABLE_BATCH_PROCESSING=false
```

## Variable Descriptions

### Ollama Service Configuration

- **OLLAMA_HOST**: The hostname where Ollama is running (default: localhost)
- **OLLAMA_PORT**: The port where Ollama is listening (default: 11434)
- **OLLAMA_MODEL**: The model name to use (default: qwen2.5vl:7b)

### AI Processing Configuration

- **AI_PROCESSING_TIMEOUT**: Maximum time in milliseconds to wait for AI responses (default: 30000)
- **AI_MAX_RETRIES**: Number of retry attempts for failed requests (default: 3)
- **AI_TEMPERATURE**: Controls randomness in AI responses (0.0-1.0, default: 0.1 for consistent
  extraction)
- **AI_MAX_TOKENS**: Maximum number of tokens in AI responses (default: 2048)
- **AI_CONTEXT_SIZE**: Context window size for the model (default: 4096)

### Application Configuration

- **NODE_ENV**: Environment mode (development/production)
- **NEXT_PUBLIC_APP_NAME**: Application name displayed in UI
- **NEXT_PUBLIC_APP_VERSION**: Application version

### Security Configuration

- **ALLOWED_ORIGINS**: Comma-separated list of allowed origins for CORS
- **API_RATE_LIMIT**: Number of requests per minute per IP
- **ENABLE_CORS**: Whether to enable CORS middleware

### Logging Configuration

- **LOG_LEVEL**: Logging level (error/warn/info/debug)
- **ENABLE_AI_LOGGING**: Whether to log AI interactions
- **ENABLE_PERFORMANCE_MONITORING**: Whether to track performance metrics

### Feature Flags

- **ENABLE_HEALTH_CHECKS**: Whether to enable health check endpoints
- **ENABLE_MODEL_CACHING**: Whether to cache model responses
- **ENABLE_BATCH_PROCESSING**: Whether to enable batch processing features

## Setup Instructions

1. Copy the environment variables above to a new file named `.env.local` in your project root
2. Adjust the values according to your setup
3. Restart your Next.js development server to apply changes

## Production Considerations

For production deployments:

1. Set `NODE_ENV=production`
2. Configure `ALLOWED_ORIGINS` with your domain
3. Set appropriate `API_RATE_LIMIT`
4. Disable `ENABLE_AI_LOGGING` for performance
5. Use secure values for all configuration options

## Troubleshooting

If you encounter issues:

1. Verify Ollama is running on the specified host and port
2. Check that the model name matches exactly what's installed
3. Ensure timeout values are appropriate for your hardware
4. Monitor logs for configuration-related errors
