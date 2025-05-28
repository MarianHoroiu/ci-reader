# Task 03-03: Implement Romanian ID Field Extraction Prompts

## Parent Story

Story 03: AI-Powered Romanian ID Extraction

## Task Description

Design and optimize AI prompts for accurate Romanian ID field extraction. This task focuses on
creating specialized prompts that guide the LLaMA 3.2 Vision model to accurately identify and
extract specific fields from Romanian identity documents, ensuring high precision and consistency in
data extraction.

## Implementation Details

### Files to Modify

- Create `app/lib/ai/prompts/romanian-id-prompts.ts` - Core prompt templates
- Create `app/lib/ai/prompts/field-extraction-patterns.ts` - Field-specific extraction logic
- Create `app/lib/ai/prompts/prompt-optimizer.ts` - Prompt optimization utilities
- Create `app/lib/constants/romanian-id-fields.ts` - Romanian ID field definitions
- Create `app/lib/utils/prompt-builder.ts` - Dynamic prompt construction
- Create `docs/romanian-id-field-guide.md` - Field extraction documentation

### Required Components

- Specialized prompts for Romanian ID document structure
- Field-specific extraction patterns (CNP, dates, addresses, names)
- JSON response format specification and validation
- Multi-language support (Romanian/English field names)
- Prompt optimization for accuracy and consistency
- Error handling for malformed responses
- Confidence scoring integration

### Technical Considerations

- Romanian language character support (diacritics: ă, â, î, ș, ț)
- CNP (Cod Numeric Personal) format validation and extraction
- Date format handling (DD.MM.YYYY, DD/MM/YYYY)
- Address parsing for Romanian administrative divisions
- Name extraction with proper capitalization
- Document series and number pattern recognition
- Issuing authority identification
- Validity date extraction and validation

## Acceptance Criteria

- Specialized prompts for Romanian ID document structure created
- Field-specific extraction patterns for all standard ID fields
- JSON response format specification implemented
- Prompt optimization for accuracy and consistency achieved
- Multi-language support (Romanian/English field names) implemented
- CNP validation and format checking integrated
- Date parsing and validation for all date fields
- Address extraction with proper Romanian formatting

## Testing Approach

- Prompt effectiveness testing with sample Romanian IDs
- Field extraction accuracy validation
- JSON response format verification
- Multi-language output testing
- Edge case handling (damaged documents, poor quality)
- Prompt optimization through iterative testing
- Confidence score calibration

## Dependencies

- Task 03-02: AI vision processing API endpoint must be functional
- Romanian ID samples for testing and validation

## Estimated Completion Time

6 hours
