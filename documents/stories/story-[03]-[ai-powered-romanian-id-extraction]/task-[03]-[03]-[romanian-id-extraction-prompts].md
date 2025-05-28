# Task 03-03: Design Romanian ID Field Extraction Prompts

## Parent Story

Story 03: AI-Powered Romanian ID Extraction

## Task Description

Design and implement specialized prompts for Qwen2.5-VL-7B-Instruct model to accurately extract
Romanian ID card fields, handle Romanian language characters, and optimize extraction accuracy
through advanced prompt engineering techniques. This task focuses on creating prompts that leverage
Qwen2.5-VL's superior instruction-following capabilities.

## Implementation Details

### Files to Modify

- Create `app/lib/prompts/romanian-id-prompts.ts` - Core prompt templates for Qwen2.5-VL
- Create `app/lib/prompts/field-extraction-patterns.ts` - Field-specific extraction logic
- Create `app/lib/prompts/romanian-language-support.ts` - Romanian character handling
- Create `app/lib/validation/prompt-validation.ts` - Prompt effectiveness testing
- Create `app/lib/utils/prompt-optimizer.ts` - Dynamic prompt optimization
- Create `docs/prompt-engineering-guide.md` - Documentation for prompt design

### Required Components

- Base prompt template optimized for Qwen2.5-VL-7B-Instruct
- Field-specific extraction patterns for all Romanian ID fields
- Romanian diacritics handling (ă, â, î, ș, ț)
- JSON response format specification
- Error handling prompts for unclear images
- Confidence scoring integration
- Multi-shot prompting examples
- Prompt validation and testing framework

### Technical Considerations

- Qwen2.5-VL-7B-Instruct's 32K token context window optimization
- Romanian language model capabilities and limitations
- Structured output formatting (JSON schema)
- Image quality adaptation prompts
- Field validation within prompts
- Prompt length optimization for performance
- Temperature and sampling parameter tuning
- Fallback prompts for edge cases

## Acceptance Criteria

- Romanian ID-specific prompts designed and tested with Qwen2.5-VL
- Field extraction patterns handle all standard Romanian ID fields
- Romanian language characters (ă, â, î, ș, ț) correctly recognized
- Prompt engineering achieves >90% extraction accuracy
- Confidence scoring implemented for each extracted field
- JSON response format consistently maintained
- Prompts optimized for Qwen2.5-VL's instruction-following capabilities
- Edge case handling for damaged or unclear images

## Testing Approach

- Prompt effectiveness testing with sample Romanian IDs
- Romanian character recognition accuracy validation
- JSON response format consistency testing
- Performance testing with various image qualities
- Edge case testing (damaged, rotated, poor quality images)
- Comparative testing against baseline OCR methods
- A/B testing of different prompt variations

## Dependencies

- Task 03-02: AI vision API endpoint for prompt integration
- Task 03-01: Qwen2.5-VL-7B-Instruct model operational
- Sample Romanian ID images for testing

## Estimated Completion Time

3 hours
