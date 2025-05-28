# Task 03-02: Create AI Vision Processing API Endpoint

## Parent Story

Story 03: AI-Powered Romanian ID Extraction

## Task Description

Create a Next.js API endpoint that integrates with the local Ollama service running
Qwen2.5-VL-7B-Instruct model to process Romanian ID images and return structured data extraction
results. This task implements the core AI processing pipeline that converts uploaded images into
structured Romanian ID data.

## Implementation Details

### Files to Modify

- Create `app/api/ai-vision-ocr/route.ts` - Next.js API route for AI processing
- Create `app/lib/ai/qwen-vision-processor.ts` - Qwen2.5-VL integration wrapper
- Create `app/lib/ai/image-handler.ts` - Image processing utilities
- Create `app/lib/types/romanian-id-types.ts` - TypeScript interfaces for Romanian ID data
- Create `app/lib/validation/image-validator.ts` - Image format and size validation
- Create `app/lib/utils/response-formatter.ts` - API response formatting utilities

### Required Components

- API endpoint accepting multipart/form-data image uploads
- Integration with Ollama Qwen2.5-VL-7B-Instruct model
- Image preprocessing and optimization for AI input
- Structured JSON response with extracted Romanian ID fields
- Error handling for AI processing failures
- Request validation and sanitization
- Response time optimization (<8 seconds)
- Memory management for large images

### Technical Considerations

- Qwen2.5-VL-7B-Instruct model API integration via Ollama
- Image format support (JPG, PNG, HEIC, WebP)
- Maximum file size limits (10MB recommended)
- Memory usage optimization during processing
- Concurrent request handling limitations
- Error recovery and retry mechanisms
- Response caching strategies
- Security considerations for file uploads
- GDPR compliance for local-only processing

## Acceptance Criteria

- API endpoint `/api/ai-vision-ocr` accepts POST requests with image uploads
- Integration with Qwen2.5-VL-7B-Instruct model via Ollama functional
- Structured JSON response with all Romanian ID fields
- Processing time consistently under 8 seconds
- Error handling for invalid images and AI failures
- Request validation prevents malicious uploads
- Memory usage remains stable during processing
- GDPR compliance with zero external network requests

## Testing Approach

- Unit testing for image validation and processing functions
- Integration testing with Qwen2.5-VL model
- Performance testing with various image sizes and formats
- Error scenario testing (corrupted images, model failures)
- Load testing for concurrent requests
- Security testing for file upload vulnerabilities
- Memory leak testing during extended operation

## Dependencies

- Task 03-01: Ollama and Qwen2.5-VL-7B-Instruct model setup
- Next.js API routes infrastructure
- Ollama service running on localhost:11434

## Estimated Completion Time

4 hours
