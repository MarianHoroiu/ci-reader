# Task [03]-[02]: Implement file type validation

## Parent Story

Story [03]: Upload Romanian ID Documents

## Task Description

Add comprehensive client-side validation for supported file formats (JPG, PNG, WEBP, PDF) with
robust MIME type checking and file extension validation. This validation layer ensures only valid
Romanian ID document formats are accepted while providing clear, user-friendly error messages for
unsupported files.

## Implementation Details

### Files to Modify

- Create `lib/validation/file-type-validator.ts` - Core file type validation logic
- Create `lib/validation/mime-type-detector.ts` - MIME type detection utilities
- Create `lib/constants/supported-formats.ts` - Supported file format definitions
- Create `components/upload/ValidationMessage.tsx` - Validation error display component
- Create `hooks/useFileValidation.ts` - React hook for file validation
- Create `lib/utils/file-signature.ts` - File signature verification utilities
- Create `__tests__/lib/validation/file-type-validator.test.ts` - Unit tests

### Required Components

- MIME type validation for images (JPG, PNG, WEBP) and PDF documents
- File extension validation as secondary check
- File signature verification for enhanced security
- User-friendly error message system
- Validation result interfaces with detailed feedback
- Integration with upload component for real-time validation

### Technical Considerations

- Implement both MIME type and file extension validation for security
- Use file signature (magic number) verification to prevent spoofing
- Handle edge cases like files without extensions or incorrect MIME types
- Provide specific error messages for different validation failures
- Consider performance impact of file signature reading
- Implement validation caching for repeated file checks
- Ensure validation works with FileList and individual File objects
- Support for Romanian-specific document format variations

## Acceptance Criteria

- [ ] MIME type validation implemented for JPG, PNG, WEBP, and PDF formats
- [ ] File extension validation provides secondary security layer
- [ ] File signature verification prevents MIME type spoofing
- [ ] Clear, specific error messages for each validation failure type
- [ ] Validation works with both single and multiple file uploads
- [ ] Performance optimized for large file validation (< 1 second per file)
- [ ] Integration with upload component provides real-time feedback
- [ ] TypeScript interfaces defined for validation results and errors
- [ ] Comprehensive unit tests cover all validation scenarios
- [ ] Edge cases handled (corrupted files, missing extensions, etc.)

## Testing Approach

- Unit tests for MIME type validation with various file types
- File signature verification testing with spoofed files
- Error message testing for all validation failure scenarios
- Performance testing with large files and multiple uploads
- Edge case testing (corrupted files, unusual formats)
- Integration testing with file upload component
- Cross-browser compatibility testing for File API usage

## Dependencies

- Task [03]-[01]: File upload component must be created first
- Task [01]-[01]: Next.js project foundation required

## Estimated Completion Time

2 hours
