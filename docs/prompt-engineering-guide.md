# Romanian ID Extraction Prompt Engineering Guide

## Overview

This guide documents the specialized prompt engineering system designed for extracting Romanian ID
card information using the Qwen2.5-VL-7B-Instruct vision-language model. The system implements
advanced prompting techniques optimized for Romanian document processing, language-specific
character handling, and high-accuracy field extraction.

## Architecture

### Core Components

1. **Prompt Templates** (`app/lib/prompts/romanian-id-prompts.ts`)

   - 5 specialized templates for different scenarios
   - Context-aware prompt selection
   - Dynamic prompt building with Romanian language support

2. **Field Extraction Patterns** (`app/lib/prompts/field-extraction-patterns.ts`)

   - Field-specific validation and normalization
   - Romanian language pattern recognition
   - Cross-field validation logic

3. **Romanian Language Support** (`app/lib/prompts/romanian-language-support.ts`)

   - Diacritical character handling (ă, â, î, ș, ț)
   - Context-based character restoration
   - Language-specific confidence scoring

4. **Prompt Validation** (`app/lib/prompts/prompt-validation.ts`)
   - Automated testing framework
   - Performance metrics and scoring
   - Improvement recommendations

## Prompt Templates

### 1. Standard Extraction (`STANDARD_EXTRACTION`)

**Use Cases:**

- High-quality images with clear text
- Complete documents with all fields visible
- Standard processing scenarios

**Key Features:**

- Comprehensive field coverage
- Romanian language handling
- Structured JSON output
- Temperature: 0.1, Max Tokens: 2048

**Example Usage:**

```typescript
import { getPromptTemplate } from '@/lib/prompts/romanian-id-prompts';

const template = getPromptTemplate('standard_extraction');
```

### 2. Enhanced Precision (`ENHANCED_PRECISION`)

**Use Cases:**

- Excellent quality images requiring maximum accuracy
- Critical accuracy scenarios
- Validation-required processing

**Key Features:**

- Character-by-character reading instructions
- Cross-validation requirements
- Enhanced Romanian document format validation
- Temperature: 0.05, Max Tokens: 2048

### 3. Robust Extraction (`ROBUST_EXTRACTION`)

**Use Cases:**

- Poor quality or damaged documents
- Partial visibility scenarios
- Degraded image conditions

**Key Features:**

- Conservative extraction approach
- Quality-adaptive processing
- Prioritized field extraction
- Temperature: 0.15, Max Tokens: 1536

### 4. Fast Extraction (`FAST_EXTRACTION`)

**Use Cases:**

- Targeted field re-extraction
- Partial extraction scenarios
- Validation checks

**Key Features:**

- Field-focused instructions
- Reduced complexity
- Quick processing
- Temperature: 0.08, Max Tokens: 1024

### 5. Adaptive Extraction (`ADAPTIVE_EXTRACTION`)

**Use Cases:**

- Complex document layouts
- Pattern learning scenarios
- Retry attempts with improved accuracy

**Key Features:**

- Few-shot learning examples
- Pattern recognition training
- Enhanced accuracy through examples
- Temperature: 0.1, Max Tokens: 3072

## Romanian Language Handling

### Diacritical Characters

The system handles all Romanian diacritical marks:

- **ă** (a-breve): Used in words like "română", "băiat"
- **â** (a-circumflex): Used in words like "român", "câine"
- **î** (i-circumflex): Used in words like "înainte", "înalt"
- **ș** (s-comma): Used in words like "școală", "oraș"
- **ț** (t-comma): Used in words like "țară", "națiune"

### Character Restoration

```typescript
import { restoreDiacritics } from '@/lib/prompts/romanian-language-support';

const text = 'STEFAN CATALIN';
const restored = restoreDiacritics(text); // "ȘTEFAN CĂTĂLIN"
```

### Common Patterns

- **Names**: POPESCU, IONESCU, GHEORGHE, ȘTEFAN, CĂTĂLIN
- **Cities**: BUCUREȘTI, CLUJ-NAPOCA, BRAȘOV, TIMIȘOARA
- **Addresses**: STR., NR., BL., AP., SC., ET.
- **Authorities**: SPCLEP + location

## Field Extraction Specifications

### Required Fields

1. **nume** (Full Name)

   - Format: UPPERCASE with diacritics
   - Pattern: `^[A-ZĂÂÎȘȚ\s\-']+$`
   - Example: "POPESCU MARIA ELENA"

2. **cnp** (Personal Numeric Code)

   - Format: Exactly 13 digits
   - Pattern: `^\d{13}$`
   - Example: "2850315123456"

3. **data_nasterii** (Birth Date)

   - Format: DD.MM.YYYY
   - Pattern: `^\d{2}\.\d{2}\.\d{4}$`
   - Example: "15.03.1985"

4. **locul_nasterii** (Birth Place)

   - Format: City name with diacritics
   - Example: "BUCUREȘTI"

5. **domiciliul** (Address)

   - Format: Complete address with abbreviations
   - Example: "STR. VICTORIEI NR. 25, BL. A1, AP. 15, BUCUREȘTI"

6. **seria_si_numarul** (ID Series and Number)

   - Format: [Letters][Space][6 digits]
   - Pattern: `^[A-Z]{1,3}\s\d{6}$`
   - Example: "RX 123456"

7. **data_eliberarii** (Issue Date)

   - Format: DD.MM.YYYY
   - Example: "20.06.2020"

8. **eliberat_de** (Issuing Authority)

   - Format: Authority name with location
   - Example: "SPCLEP BUCUREȘTI"

9. **valabil_pana_la** (Expiry Date)
   - Format: DD.MM.YYYY
   - Example: "20.06.2030"

## Context-Aware Prompt Selection

### Image Quality Assessment

```typescript
import { getOptimalPrompt } from '@/lib/prompts/romanian-id-prompts';

const context = {
  imageQuality: 'poor',
  previousAttempts: 1,
  focusFields: ['nume', 'cnp'],
};

const template = getOptimalPrompt(context);
```

### Selection Logic

- **Excellent Quality** → Enhanced Precision
- **Poor Quality** → Robust Extraction
- **Focus Fields** → Fast Extraction
- **Retry Attempts** → Adaptive Extraction
- **Default** → Standard Extraction

## Validation and Testing

### Automated Testing

```typescript
import { runPromptTests, createTestCases } from '@/lib/prompts/prompt-validation';

const testCases = createTestCases();
const results = await runPromptTests(extractionFunction, testCases);

console.log(`Overall Score: ${results.overallScore}`);
console.log(`Passed Tests: ${results.summary.passedTests}/${results.summary.totalTests}`);
```

### Test Scenarios

1. **Standard Romanian ID** - High-quality, complete document
2. **Diacritics Test** - Romanian characters preservation
3. **Poor Quality** - Low-quality scan with unclear text
4. **Partial Document** - Cut-off or missing fields
5. **Complex Address** - Multi-line address formatting

### Performance Metrics

- **Extraction Accuracy**: Field-level accuracy vs expected values
- **Format Compliance**: Validation rule adherence
- **Language Accuracy**: Romanian language confidence
- **Completeness**: Percentage of extracted fields

## Best Practices

### Prompt Design

1. **Clear Instructions**: Use specific, actionable language
2. **Romanian Context**: Include language-specific guidance
3. **Format Specification**: Clearly define expected output format
4. **Error Handling**: Provide guidance for unclear cases
5. **Examples**: Include representative examples when helpful

### Temperature Settings

- **High Precision**: 0.01-0.05 (deterministic)
- **Standard**: 0.08-0.15 (balanced)
- **Robust**: 0.15-0.25 (flexible)

### Token Optimization

- **Focused Extraction**: 1024 tokens
- **Standard Processing**: 2048 tokens
- **Complex Scenarios**: 3072 tokens

## Integration Examples

### Basic Usage

```typescript
import { processWithRetry } from '@/lib/ai/qwen-vision-processor';

const result = await processWithRetry(imageBase64, {
  enableRomanianEnhancements: true,
  enableValidation: true,
  promptContext: {
    imageQuality: 'good',
  },
});
```

### Custom Prompt

```typescript
import { buildContextualPrompt, getPromptTemplate } from '@/lib/prompts/romanian-id-prompts';

const template = getPromptTemplate('enhanced_precision');
const context = { imageQuality: 'excellent' };
const customPrompt = buildContextualPrompt(template, context);
```

### Field-Specific Extraction

```typescript
const context = {
  focusFields: ['nume', 'cnp', 'data_nasterii'],
  imageQuality: 'fair',
};

const result = await processWithRetry(imageBase64, {
  promptContext: context,
});
```

## Troubleshooting

### Common Issues

1. **Missing Diacritics**

   - Solution: Enable Romanian language enhancements
   - Check: `enableRomanianEnhancements: true`

2. **Incorrect Date Format**

   - Solution: Use enhanced precision template
   - Check: Date validation patterns

3. **Low Confidence Scores**

   - Solution: Adjust image quality assessment
   - Check: Use robust extraction for poor quality

4. **Incomplete Extraction**
   - Solution: Use retry logic with adaptive prompting
   - Check: `processWithRetry()` with multiple attempts

### Performance Optimization

1. **Template Selection**: Choose appropriate template for scenario
2. **Context Tuning**: Provide accurate image quality assessment
3. **Field Prioritization**: Focus on critical fields when needed
4. **Retry Strategy**: Use adaptive prompting for failed attempts

## Advanced Features

### Prompt Variations

```typescript
import { generatePromptVariations } from '@/lib/prompts/romanian-id-prompts';

const variations = generatePromptVariations(baseTemplate, context);
```

### Adaptive Prompting

```typescript
import { createAdaptivePrompt } from '@/lib/prompts/romanian-id-prompts';

const adaptiveTemplate = createAdaptivePrompt(extractionHistory, context);
```

### Cross-Field Validation

```typescript
import { crossValidateFields } from '@/lib/prompts/field-extraction-patterns';

const validation = crossValidateFields(extractedFields);
```

## Conclusion

This prompt engineering system provides a comprehensive solution for Romanian ID extraction using
Qwen2.5-VL-7B-Instruct. The modular design allows for flexible adaptation to different scenarios
while maintaining high accuracy and Romanian language fidelity.

For additional support or customization, refer to the individual module documentation and test cases
provided in the codebase.
