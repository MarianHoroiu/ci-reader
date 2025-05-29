/**
 * Field-Specific Extraction Patterns for Romanian ID Documents
 * Specialized patterns and validation rules for each field type
 */

import type { RomanianIDFields } from '@/lib/types/romanian-id-types';

// Field extraction pattern types
export interface FieldPattern {
  /** Field name */
  field: keyof RomanianIDFields;
  /** Field description */
  description: string;
  /** Validation regex pattern */
  pattern?: RegExp;
  /** Extraction instructions */
  instructions: string;
  /** Common variations and formats */
  variations: string[];
  /** Validation function */
  validate: (_value: string) => boolean;
  /** Normalization function */
  normalize: (_value: string) => string;
  /** Common errors to avoid */
  commonErrors: string[];
}

/**
 * Surname field extraction pattern
 */
export const NUME_PATTERN: FieldPattern = {
  field: 'nume',
  description: 'Surname extraction with Romanian diacritics',
  pattern: /^[A-ZĂÂÎȘȚ\s\-']+$/,
  instructions: `
Extract the surname (Nume/Lastname):
- Usually appears in UPPERCASE letters
- May contain Romanian diacritics: Ă, Â, Î, Ș, Ț
- Can include hyphens for compound surnames
- Preserve exact spacing and diacritics
- Common format: "POPESCU" or "IONESCU-STAN"
`,
  variations: [
    'POPESCU',
    'IONESCU-STAN',
    'GHEORGHE',
    'MUNTEANU',
    'TRIHENEA',
    'POPESCU-TĂRICEANU',
  ],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 2) return false;
    return true;
  },
  normalize: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  },
  commonErrors: [
    'Missing diacritics (using A instead of Ă)',
    'Incorrect case (lowercase instead of uppercase)',
    'Extra spaces',
    'Truncated names due to image boundaries',
  ],
};

/**
 * Given name field extraction pattern
 */
export const PRENUME_PATTERN: FieldPattern = {
  field: 'prenume',
  description: 'Given name extraction with Romanian diacritics',
  pattern: /^[A-ZĂÂÎȘȚ\s\-']+$/,
  instructions: `
Extract the given name/first name (Prenume):
- Usually appears in UPPERCASE letters
- May contain Romanian diacritics: Ă, Â, Î, Ș, Ț
- Can include hyphens for compound names
- May have multiple given names
- Preserve exact spacing and diacritics
- Common format: "MARIA ELENA" or "ȘTEFAN CĂTĂLIN"
`,
  variations: [
    'MARIA ELENA',
    'ALEXANDRA',
    'ȘTEFAN CĂTĂLIN',
    'IOANA CRISTINA',
    'MANOLE',
    'ANTON CĂLIN CONSTANTIN',
  ],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 2) return false;
    return true;
  },
  normalize: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  },
  commonErrors: [
    'Missing diacritics (using A instead of Ă)',
    'Incorrect case (lowercase instead of uppercase)',
    'Extra spaces between names',
    'Truncated names due to image boundaries',
  ],
};

/**
 * CNP (Personal Numeric Code) extraction pattern
 */
export const CNP_PATTERN: FieldPattern = {
  field: 'cnp',
  description: 'Personal Numeric Code - exactly 13 digits',
  pattern: /^\d{13}$/,
  instructions: `
Extract the CNP (Cod Numeric Personal):
- Must be exactly 13 consecutive digits
- No spaces, dashes, or other separators
- First digit indicates gender and century:
  * 1-2: Male/Female born 1900-1999
  * 3-4: Male/Female born 1800-1899
  * 5-6: Male/Female born 2000-2099
  * 7-8: Male/Female foreign residents
- Digits 2-7 represent birth date (YYMMDD)
- Digits 8-9 represent county code
- Digits 10-12 are sequential numbers
- Digit 13 is a check digit
`,
  variations: [
    '1850315123456',
    '2950123456789',
    '5001201234567',
    '6990815123456',
  ],
  validate: (value: string): boolean => {
    if (!value || !/^\d{13}$/.test(value)) return false;

    // Basic CNP validation
    const firstDigit = parseInt(value[0] || '0', 10);
    if (firstDigit < 1 || firstDigit > 8) return false;

    // Extract birth date components
    const month = parseInt(value.substring(3, 5), 10);
    const day = parseInt(value.substring(5, 7), 10);

    // Validate date components
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    return true;
  },
  normalize: (value: string): string => {
    return value.replace(/\D/g, '');
  },
  commonErrors: [
    'Including spaces or dashes',
    'Incorrect digit count (less or more than 13)',
    'Confusing similar digits (0/O, 1/I)',
    'Missing leading zeros',
  ],
};

/**
 * Date field extraction pattern (birth, issue, expiry dates)
 */
export const DATE_PATTERN: FieldPattern = {
  field: 'data_nasterii', // Representative for all date fields
  description: 'Date extraction in DD.MM.YYYY format',
  pattern: /^\d{2}\.\d{2}\.\d{4}$/,
  instructions: `
Extract dates in DD.MM.YYYY format:
- Day: 01-31 (with leading zero)
- Month: 01-12 (with leading zero)
- Year: Full 4-digit year
- Separator: Period (.) between components
- Examples: 15.03.1985, 01.12.2020
- Validate logical date ranges
- Cross-check with CNP when possible
`,
  variations: ['15.03.1985', '01.12.2020', '25.07.1992', '03.11.1978'],
  validate: (value: string): boolean => {
    if (!value || !/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return false;

    const parts = value.split('.');
    if (parts.length !== 3) return false;

    const dayStr = parts[0];
    const monthStr = parts[1];
    const yearStr = parts[2];

    if (!dayStr || !monthStr || !yearStr) return false;

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    // Basic range validation
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;

    // More specific day validation based on month
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxDaysForMonth = daysInMonth[month - 1];
    if (maxDaysForMonth && day > maxDaysForMonth) return false;

    // February leap year check
    if (month === 2 && day === 29) {
      const isLeapYear =
        (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      if (!isLeapYear) return false;
    }

    return true;
  },
  normalize: (value: string): string => {
    // Ensure proper formatting with leading zeros
    const parts = value.split(/[.\-/]/);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
    return value;
  },
  commonErrors: [
    'Wrong separator (/ or - instead of .)',
    'Missing leading zeros (1.3.1985 instead of 01.03.1985)',
    'Wrong date format (MM.DD.YYYY instead of DD.MM.YYYY)',
    'Invalid dates (32.13.1985)',
  ],
};

/**
 * Address field extraction pattern
 */
export const ADDRESS_PATTERN: FieldPattern = {
  field: 'domiciliul',
  description: 'Complete address with Romanian abbreviations',
  instructions: `
Extract the complete address (Domiciliul):
- Include all address components
- Preserve Romanian abbreviations:
  * STR. (Strada - Street)
  * NR. (Numărul - Number)
  * BL. (Blocul - Block)
  * AP. (Apartamentul - Apartment)
  * SC. (Scara - Staircase)
  * ET. (Etajul - Floor)
- Maintain original formatting and diacritics
- Include locality/city name
- May span over multiple lines
`,
  variations: [
    'STR. VICTORIEI NR. 25, BL. A1, AP. 15, BUCUREȘTI',
    'STR. MIHAI VITEAZU NR. 10, CLUJ-NAPOCA',
    'STR. REPUBLICII NR. 45, BL. C2, SC. A, ET. 3, AP. 12, BRAȘOV',
    'CALEA DOROBANȚILOR NR. 100, TIMIȘOARA',
    'Cal.Dorobanților nr.10, bl.x5, ap.35',
  ],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 5) return false;
    // Should contain at least a street indicator or number
    return /(?:STR\.|CALEA|BDUL|PIAȚA|NR\.|\d+)/i.test(value);
  },
  normalize: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },
  commonErrors: [
    'Missing abbreviation periods (STR instead of STR.)',
    'Incorrect abbreviations (STRADA instead of STR.)',
    'Missing address components',
    'Truncated due to line breaks',
  ],
};

/**
 * ID Series extraction pattern
 */
export const SERIA_PATTERN: FieldPattern = {
  field: 'seria',
  description: 'ID series county code',
  pattern: /^[A-Z]{1,3}$/,
  instructions: `
Extract the ID series:
- Format: County Code (1-3 letters)
- Common codes: RX, CJ, BV, TM, CT, etc.
- Preserve exact case (usually uppercase)
`,
  variations: ['RX', 'CJ', 'BV', 'TM', 'CT'],
  validate: (value: string): boolean => {
    if (!value) return false;
    return /^[A-Z]{1,3}$/.test(value);
  },
  normalize: (value: string): string => {
    return value.trim().toUpperCase();
  },
  commonErrors: ['Lowercase letters', 'Including the number part'],
};

/**
 * ID Number extraction pattern
 */
export const NUMAR_PATTERN: FieldPattern = {
  field: 'numar',
  description: 'ID number (6 digits)',
  pattern: /^\d{6}$/,
  instructions: `
Extract the ID number:
- Format: 6 digits
- No spaces or separators
- Common format: "123456"
`,
  variations: ['123456', '789012', '345678', '901234', '567890'],
  validate: (value: string): boolean => {
    if (!value) return false;
    return /^\d{6}$/.test(value);
  },
  normalize: (value: string): string => {
    // Remove any non-digit characters
    return value.replace(/\D/g, '');
  },
  commonErrors: [
    'Including the series letters',
    'Missing digits',
    'Extra characters',
  ],
};

/**
 * Issuing Authority extraction pattern
 */
export const AUTHORITY_PATTERN: FieldPattern = {
  field: 'eliberat_de',
  description: 'Issuing authority with location',
  pattern: /^SPCLEP\s.+$/,
  instructions: `
Extract the issuing authority:
- Usually starts with "SPCLEP" (Serviciul Public Comunitar Local de Evidență a Persoanelor)
- Followed by location name
- May include full authority name
- Preserve exact formatting and diacritics
- Common format: "SPCLEP [CITY/COUNTY]"
`,
  variations: [
    'SPCLEP BUCUREȘTI',
    'SPCLEP CLUJ',
    'SPCLEP BRAȘOV',
    'SPCLEP TIMIȘOARA',
    'SPCLEP CONSTANȚA',
  ],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 5) return false;
    // Should contain SPCLEP or similar authority indicator
    return /SPCLEP|EVIDENTA|PERSOANE/i.test(value);
  },
  normalize: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },
  commonErrors: [
    'Incomplete authority name',
    'Missing location specification',
    'Incorrect abbreviations',
    'Case sensitivity issues',
  ],
};

/**
 * Birth place extraction pattern
 */
export const BIRTH_PLACE_PATTERN: FieldPattern = {
  field: 'locul_nasterii',
  description: 'Birth place with Romanian location names',
  instructions: `
Extract the birth place:
- City or locality name
- May include county information
- Preserve Romanian diacritics
- Common major cities: BUCUREȘTI, CLUJ-NAPOCA, TIMIȘOARA, IAȘI, CONSTANȚA
- May be abbreviated or full name
- Handle compound city names with hyphens
`,
  variations: [
    'BUCUREȘTI',
    'CLUJ-NAPOCA',
    'BRAȘOV',
    'TIMIȘOARA',
    'CONSTANȚA',
    'IAȘI',
    'CRAIOVA',
  ],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 2) return false;
    // Should be a valid location name
    return /^[A-ZĂÂÎȘȚ\s-]+$/.test(value);
  },
  normalize: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  },
  commonErrors: [
    'Missing diacritics in city names',
    'Incorrect case (lowercase)',
    'Abbreviated forms without context',
    'Truncated compound names',
  ],
};

/**
 * All field patterns for easy access
 */
export const FIELD_PATTERNS = {
  nume: NUME_PATTERN,
  prenume: PRENUME_PATTERN,
  cnp: CNP_PATTERN,
  data_nasterii: DATE_PATTERN,
  locul_nasterii: BIRTH_PLACE_PATTERN,
  domiciliul: ADDRESS_PATTERN,
  seria: SERIA_PATTERN,
  numar: NUMAR_PATTERN,
  data_eliberarii: DATE_PATTERN,
  valabil_pana_la: DATE_PATTERN,
  eliberat_de: AUTHORITY_PATTERN,
} as const;

/**
 * Get field-specific extraction instructions
 */
export function getFieldInstructions(field: keyof RomanianIDFields): string {
  const pattern = FIELD_PATTERNS[field];
  return pattern.instructions;
}

/**
 * Validate extracted field value
 */
export function validateField(
  field: keyof RomanianIDFields,
  value: string | null
): boolean {
  if (!value) return true; // null values are acceptable

  const pattern = FIELD_PATTERNS[field];
  return pattern.validate(value);
}

/**
 * Normalize extracted field value
 */
export function normalizeField(
  field: keyof RomanianIDFields,
  value: string
): string {
  const pattern = FIELD_PATTERNS[field];
  return pattern.normalize(value);
}

/**
 * Get field-specific validation pattern
 */
export function getFieldPattern(
  field: keyof RomanianIDFields
): RegExp | undefined {
  const pattern = FIELD_PATTERNS[field];
  return pattern.pattern;
}

/**
 * Generate field-specific extraction prompt
 */
export function generateFieldPrompt(
  fields: (keyof RomanianIDFields)[],
  includeExamples: boolean = true
): string {
  const fieldInstructions = fields
    .map(field => {
      const pattern = FIELD_PATTERNS[field];
      let instruction = `${field.toUpperCase()}:\n${pattern.instructions}`;

      if (includeExamples && pattern.variations.length > 0) {
        instruction += `\nExamples: ${pattern.variations.join(', ')}`;
      }

      return instruction;
    })
    .join('\n\n');

  return `
FIELD-SPECIFIC EXTRACTION INSTRUCTIONS:

${fieldInstructions}

VALIDATION REQUIREMENTS:
${fields
  .map(field => {
    const pattern = FIELD_PATTERNS[field];
    return `- ${field}: ${pattern.description}`;
  })
  .join('\n')}

COMMON ERRORS TO AVOID:
${fields
  .map(field => {
    const pattern = FIELD_PATTERNS[field];
    return pattern.commonErrors.map(error => `- ${field}: ${error}`).join('\n');
  })
  .join('\n')}
`;
}

/**
 * Cross-validate related fields for consistency
 */
export function crossValidateFields(fields: Partial<RomanianIDFields>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Cross-validate CNP with birth date and gender
  if (fields.cnp && fields.data_nasterii) {
    const cnpDate = extractDateFromCNP(fields.cnp);
    if (cnpDate && cnpDate !== fields.data_nasterii) {
      errors.push('CNP birth date does not match data_nasterii field');
    }
  }

  // TODO: Check this as it may not be needed
  // Validate seria and numar against birth place (county codes)
  const seria = fields.seria;

  if (seria && fields.locul_nasterii) {
    const birthPlace = fields.locul_nasterii;

    // Common county code mappings
    const countyCodes: Record<string, string[]> = {
      B: ['BUCUREȘTI'],
      CJ: ['CLUJ', 'CLUJ-NAPOCA'],
      BV: ['BRAȘOV'],
      TM: ['TIMIȘOARA'],
      CT: ['CONSTANȚA'],
      IS: ['IAȘI'],
    };

    const expectedCities = countyCodes[seria];
    if (
      expectedCities &&
      !expectedCities.some((city: string) => birthPlace.includes(city))
    ) {
      warnings.push('Series code may not match birth place');
    }
  }

  // Validate date relationships
  if (fields.data_nasterii && fields.data_eliberarii) {
    const birthDate = new Date(
      fields.data_nasterii.split('.').reverse().join('-')
    );
    const issueDate = new Date(
      fields.data_eliberarii.split('.').reverse().join('-')
    );

    if (issueDate <= birthDate) {
      errors.push('Issue date must be after birth date');
    }
  }

  if (fields.data_eliberarii && fields.valabil_pana_la) {
    const issueDate = new Date(
      fields.data_eliberarii.split('.').reverse().join('-')
    );
    const expiryDate = new Date(
      fields.valabil_pana_la.split('.').reverse().join('-')
    );

    if (expiryDate <= issueDate) {
      errors.push('Expiry date must be after issue date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract birth date from CNP
 */
function extractDateFromCNP(cnp: string): string | null {
  if (!cnp || cnp.length !== 13) return null;

  const firstDigit = parseInt(cnp[0] || '0', 10);
  let year = parseInt(cnp.substring(1, 3), 10);
  const month = cnp.substring(3, 5);
  const day = cnp.substring(5, 7);

  // Determine century based on first digit
  if (firstDigit === 1 || firstDigit === 2) {
    year += 1900;
  } else if (firstDigit === 5 || firstDigit === 6) {
    year += 2000;
  } else if (firstDigit === 3 || firstDigit === 4) {
    year += 1800;
  } else {
    return null; // Invalid first digit
  }

  return `${day}.${month}.${year}`;
}
