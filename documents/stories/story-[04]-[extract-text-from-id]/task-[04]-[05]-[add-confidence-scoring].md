# Task [04]-[05]: Add confidence scoring for extracted text

## Parent Story

Story [04]: Extract Text from ID

## Task Description

Implement confidence scoring system for OCR results to help users identify potentially inaccurate
extractions. This includes calculating confidence scores per field, providing visual indicators for
low-confidence extractions, implementing threshold-based validation, and highlighting fields that
may need manual review.

## Implementation Details

### Files to Modify

- Create `lib/confidence/confidence-calculator.ts` - Main confidence scoring algorithms
- Create `lib/confidence/field-confidence-analyzer.ts` - Per-field confidence analysis
- Create `lib/confidence/threshold-validator.ts` - Confidence threshold validation
- Create `lib/confidence/confidence-types.ts` - TypeScript interfaces for confidence scoring
- Create `app/components/ui/ConfidenceIndicator.tsx` - Visual confidence indicators
- Create `app/components/ui/FieldHighlighter.tsx` - Field highlighting based on confidence
- Create `lib/validation/romanian-id-patterns.ts` - Romanian ID field validation patterns
- Create `lib/hooks/useConfidenceScoring.ts` - React hook for confidence state management
- Modify `lib/ocr/ocr-engine.ts` - Integrate confidence scoring with OCR results

### Required Components

- Confidence score calculation algorithms (0-100% scale)
- Per-field confidence analysis for Romanian ID fields
- Visual confidence indicators (color-coded, progress bars, icons)
- Threshold-based validation system
- Field highlighting and warning system
- Romanian ID format validation for confidence boosting
- Statistical analysis of OCR character recognition confidence
- User-configurable confidence thresholds

### Technical Considerations

- Use Tesseract.js confidence data as base for calculations
- Implement field-specific confidence adjustments based on Romanian ID patterns
- Consider character-level confidence for overall field confidence
- Provide different confidence thresholds for different field types
- Implement confidence-based sorting and prioritization
- Handle edge cases where Tesseract confidence is unavailable
- Ensure confidence calculations don't significantly impact performance
- Consider historical accuracy data to improve confidence predictions

## Acceptance Criteria

- [ ] Confidence score calculation implemented for each extracted field (0-100%)
- [ ] Visual indicators show confidence levels with color coding (red/yellow/green)
- [ ] Low-confidence extractions highlighted for user attention
- [ ] Threshold-based validation flags fields below configurable confidence levels
- [ ] Confidence-based field highlighting guides user review process
- [ ] Romanian ID format validation boosts confidence for correctly formatted fields
- [ ] Per-field confidence analysis considers field-specific characteristics
- [ ] User can configure confidence thresholds for different validation levels
- [ ] Confidence scores persist with extracted data for future reference
- [ ] Performance impact of confidence calculation is minimal (<5% overhead)

## Testing Approach

- Unit test confidence calculation algorithms with known OCR results
- Test confidence scoring with various quality Romanian ID images
- Verify visual indicators display correctly for different confidence levels
- Test threshold validation with different confidence settings
- Validate Romanian ID pattern matching improves confidence scores
- Performance test confidence calculation overhead
- Test confidence persistence and retrieval
- User acceptance testing for confidence indicator usefulness
- Integration test confidence scoring with complete OCR pipeline

## Dependencies

- Task [04]-[01]: Tesseract.js configuration needed for base confidence data
- Task [04]-[03]: Image preprocessing may affect confidence calculations

## Estimated Completion Time

3 hours
