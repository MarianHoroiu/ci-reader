# Task 03-02: AI Vision Processing API Endpoint - Implementation Guide

## Overview

This document provides a comprehensive guide for the AI Vision Processing API Endpoint
implementation for Romanian ID document processing using Qwen2.5-VL model via Ollama.

## Architecture

### Component Structure

```
app/api/ai-vision-ocr/
├── route.ts                           # Main API endpoint
app/lib/
├── types/
│   └── romanian-id-types.ts          # TypeScript interfaces
├── validation/
│   └── image-validator.ts            # AI-specific image validation
├── ai/
│   ├── image-handler.ts              # Image processing utilities
│   ├── qwen-vision-processor.ts      # Qwen2.5-VL integration
│   └── ollama-client.ts              # Existing Ollama client
└── utils/
    └── response-formatter.ts         # API response formatting
```

### Data Flow

1. **Request Reception**: API receives multipart/form-data with image
2. **Validation**: Image validated for AI processing requirements
3. **Preprocessing**: Image optimized for Romanian ID processing
4. **AI Processing**: Qwen2.5-VL model extracts Romanian ID fields
5. **Response Formatting**: Structured JSON response with confidence scores
6. **Logging**: Request/response logged for monitoring

## API Specification

### Endpoint

```
POST /api/ai-vision-ocr
GET /api/ai-vision-ocr (health check)
```

### Request Format

**Content-Type**: `multipart/form-data`

**Parameters**:

- `image` (File, required): Romanian ID image (JPEG, PNG, WebP, HEIC)
- `custom_prompt` (string, optional): Custom extraction prompt
- `temperature` (number, optional): AI model temperature (0-1)
- `max_tokens` (number, optional): Maximum response tokens
- `enhance_image` (boolean, optional): Enable image enhancement

### Response Format

```typescript
interface AIVisionOCRResponse {
  success: boolean;
  data?: RomanianIDExtractionResult;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    request_id: string;
    timestamp: string;
    processing_time: number;
    performance?: {
      model_response_time: number;
      preprocessing_time: number;
      parsing_time: number;
    };
  };
}
```

### Romanian ID Fields

The API extracts the following fields from Romanian ID cards:

- `nume`: Full name (Nume și Prenume)
- `cnp`: Personal Numeric Code (13 digits)
- `data_nasterii`: Date of birth (DD.MM.YYYY)
- `locul_nasterii`: Place of birth
- `domiciliul`: Address/Domicile
- `seria_si_numarul`: ID series and number
- `data_eliberarii`: Issue date (DD.MM.YYYY)
- `eliberat_de`: Issuing authority
- `valabil_pana_la`: Validity date (DD.MM.YYYY)

## Usage Examples

### Basic Usage

```bash
curl -X POST http://localhost:3000/api/ai-vision-ocr \
  -F "image=@romanian_id.jpg"
```

### Advanced Usage

```bash
curl -X POST http://localhost:3000/api/ai-vision-ocr \
  -F "image=@romanian_id.jpg" \
  -F "temperature=0.1" \
  -F "enhance_image=true" \
  -F "max_tokens=2048"
```

### Health Check

```bash
curl http://localhost:3000/api/ai-vision-ocr
```

## Configuration

### Environment Variables

```bash
# Ollama Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=qwen2.5vl:7b
AI_PROCESSING_TIMEOUT=30000

# Next.js Configuration
NODE_ENV=development
```

### Image Constraints

- **Maximum file size**: 10MB
- **Minimum dimensions**: 300x200 pixels
- **Maximum dimensions**: 4096x4096 pixels
- **Supported formats**: JPEG, PNG, WebP, HEIC
- **Recommended aspect ratio**: 1.2:1 to 2.5:1 (Romanian ID cards)

## Performance Optimization

### Processing Time Targets

- **Total processing time**: < 8 seconds
- **Image preprocessing**: < 1 second
- **AI model processing**: < 6 seconds
- **Response formatting**: < 1 second

### Concurrent Request Handling

- **Maximum concurrent requests**: 3
- **Request timeout**: 8 seconds
- **Rate limiting**: 429 status for excess requests

### Memory Management

- **Image optimization**: Automatic resizing for large images
- **Base64 conversion**: Efficient memory usage
- **Cleanup**: Automatic resource cleanup after processing

## Error Handling

### Error Codes

- `INVALID_IMAGE`: Invalid or corrupted image
- `IMAGE_TOO_LARGE`: File size exceeds 10MB limit
- `UNSUPPORTED_FORMAT`: Unsupported image format
- `MODEL_UNAVAILABLE`: Qwen2.5-VL model not available
- `PROCESSING_TIMEOUT`: Processing exceeded time limit
- `EXTRACTION_FAILED`: Failed to extract Romanian ID data
- `INVALID_RESPONSE`: AI model returned invalid response
- `INTERNAL_ERROR`: Unexpected server error

### HTTP Status Codes

- `200`: Success
- `400`: Bad request (validation error)
- `408`: Request timeout
- `422`: Unprocessable entity (extraction failed)
- `429`: Too many requests
- `500`: Internal server error
- `503`: Service unavailable

## Security Features

### GDPR Compliance

- **Local processing**: All processing performed locally
- **No external requests**: Zero data transmission to external services
- **Memory cleanup**: Automatic cleanup of processed images
- **No persistent storage**: Images not stored on server

### Input Validation

- **File type validation**: Strict MIME type and signature checking
- **Size limits**: Enforced file size constraints
- **Content validation**: Image structure verification
- **Sanitization**: Response data sanitization

## Monitoring and Logging

### Request Logging

```typescript
{
  request_id: "req_abc123",
  success: true,
  processing_time: 4500,
  response_size: 2048,
  timestamp: "2024-01-15T10:30:00Z",
  fileSize: 1024000,
  userAgent: "Mozilla/5.0..."
}
```

### Performance Metrics

- **Model response time**: Time spent in AI processing
- **Preprocessing time**: Image optimization duration
- **Parsing time**: Response parsing duration
- **Total processing time**: End-to-end request duration

## Troubleshooting

### Common Issues

#### 1. Model Not Available

**Error**: `MODEL_UNAVAILABLE`

**Solution**:

```bash
# Check if Ollama is running
curl http://localhost:11434

# Pull the Qwen2.5-VL model
ollama pull qwen2.5vl:7b

# Verify model installation
ollama list
```

#### 2. Processing Timeout

**Error**: `PROCESSING_TIMEOUT`

**Causes**:

- Large image files
- High system load
- Model loading time

**Solutions**:

- Reduce image size
- Increase timeout in configuration
- Ensure sufficient system resources

#### 3. Image Validation Errors

**Error**: `INVALID_IMAGE` or `UNSUPPORTED_FORMAT`

**Solutions**:

- Use supported formats (JPEG, PNG, WebP, HEIC)
- Ensure minimum dimensions (300x200)
- Check file integrity

#### 4. Low Extraction Accuracy

**Causes**:

- Poor image quality
- Unusual document orientation
- Damaged or partial documents

**Solutions**:

- Use higher quality images
- Enable image enhancement
- Ensure complete document visibility

### Debugging

#### Enable Debug Logging

```bash
# Set environment variable
DEBUG=ai-vision:*

# Or use console logging
NODE_ENV=development
```

#### Test Model Connectivity

```bash
# Test Ollama health
curl http://localhost:3000/api/ai/health

# Test AI vision endpoint
curl http://localhost:3000/api/ai-vision-ocr
```

## Development

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Full check
npm run check
```

### Local Development

```bash
# Start development server
npm run dev

# Test with sample image
curl -X POST http://localhost:3000/api/ai-vision-ocr \
  -F "image=@test-images/sample-romanian-id.jpg"
```

## Integration with Task 03-03

This implementation prepares the foundation for Task 03-03 (Romanian ID Extraction Prompts) by:

- Providing the `custom_prompt` parameter for advanced prompt engineering
- Implementing confidence scoring for prompt effectiveness testing
- Supporting temperature and token limit adjustments
- Offering detailed response parsing for prompt optimization

## Production Considerations

### Scaling

- **Horizontal scaling**: Multiple server instances
- **Load balancing**: Distribute requests across instances
- **Resource monitoring**: CPU, memory, and disk usage tracking

### Security

- **Input sanitization**: Comprehensive validation
- **Rate limiting**: Prevent abuse
- **Error handling**: Secure error messages
- **Audit logging**: Request tracking for compliance

### Monitoring

- **Health checks**: Regular service availability checks
- **Performance metrics**: Response time and throughput monitoring
- **Error tracking**: Comprehensive error logging and alerting
- **Resource usage**: System resource monitoring

## Conclusion

The AI Vision Processing API Endpoint provides a robust, secure, and performant solution for
Romanian ID document processing using the Qwen2.5-VL model. The implementation follows best
practices for API design, error handling, and security while maintaining GDPR compliance through
local-only processing.

The modular architecture allows for easy maintenance and extension, while comprehensive logging and
monitoring ensure reliable operation in production environments.
