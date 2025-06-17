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
  description:
    'Personal Numeric Code - exactly 13 digits with birth date and sex encoding',
  pattern: /^\d{13}$/,
  instructions: `
Extract the CNP (Cod Numeric Personal):
- Must be exactly 13 consecutive digits
- No spaces, dashes, or other separators
- First digit indicates gender and century:
  * 1=Male born 1900-1999
  * 2=Female born 1900-1999
  * 5=Male born 2000-2099
  * 6=Female born 2000-2099
- Digits 2-7 represent birth date (YYMMDD)
- Digits 8-9 represent county code
- Digits 10-12 are sequential numbers
- Digit 13 is a check digit
- The CNP is the source of birth date information
- The CNP's first digit must be consistent with the sex field
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
    'Inconsistency between CNP and sex field',
    'Not validating the check digit',
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
- For birth date: NOT visible on card, extract from CNP
- For expiry date: Day and month MUST match birth date
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
    'Looking for birth date on the card instead of extracting from CNP',
    'Expiry date not matching birth date day and month',
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
- Include ALL address components from ALL LINES
- Preserve Romanian abbreviations:
  * STR. (Strada - Street)
  * NR. (Numărul - Number)
  * BL. (Blocul - Block)
  * AP. (Apartamentul - Apartment)
  * SC. (Scara - Staircase)
  * ET. (Etajul - Floor)
  * JUD. (Județul - County)
  * COM. (Comuna - Commune)
  * SAT. (Satul - Village)
  * ORȘ. (Orașul - Town)
  * MUN. (Municipiul - Municipality)
- Maintain original formatting and diacritics
- Include locality/city name and county
- MUST include ALL LINES from the address section
- Be careful not to confuse address with other fields
`,
  variations: [
    'STR. VICTORIEI NR. 25, BL. A1, AP. 15, BUCUREȘTI',
    'STR. MIHAI VITEAZU NR. 10, CLUJ-NAPOCA',
    'STR. REPUBLICII NR. 45, BL. C2, SC. A, ET. 3, AP. 12, BRAȘOV',
    'CALEA DOROBANȚILOR NR. 100, TIMIȘOARA',
    'JUD. AB SAT. CĂRPINIȘ (COM. ROȘIA MONTANĂ)',
    'JUD. ALBA MUN. ALBA IULIA STR. TRANSILVANIEI NR. 21',
  ],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 5) return false;
    // Should contain at least common address indicators
    return /(?:STR\.|CALEA|BDUL|PIAȚA|NR\.|BL\.|AP\.|ET\.|SC\.|JUD\.|COM\.|SAT\.|MUN\.|ORȘ\.|\d+)/i.test(
      value
    );
  },
  normalize: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },
  commonErrors: [
    'Missing abbreviation periods (STR instead of STR.)',
    'Incorrect abbreviations (STRADA instead of STR.)',
    'Missing address components',
    'Only extracting the first line when address spans multiple lines',
    'Confusing parts of address with ID number or other fields',
  ],
};

/**
 * Tip Document extraction pattern
 */
export const TIP_DOCUMENT_PATTERN: FieldPattern = {
  field: 'tip_document',
  description: 'Tip Document (Carte de Identitate)',
  pattern: /^Carte de Identitate$/,
  instructions: `
Extract the tip document:
- Format: "Carte de Identitate"
- Common format: "Carte de Identitate"
- Located at the top of the ID, right after country name
`,
  variations: ['Carte de Identitate'],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 2) return false;
    return true;
  },
  normalize: (value: string): string => {
    return value.trim().toUpperCase();
  },
  commonErrors: ['Lowercase letters', 'Including the number part'],
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
  description: 'ID number (exactly 6 digits)',
  pattern: /^\d{6}$/,
  instructions: `
Extract the ID number:
- Format: EXACTLY 6 digits
- No spaces or separators
- MUST contain ONLY digits, NO letters
- Common format: "123456"
- Located near "NR." label on the ID
- If it appears to have letters or fewer than 6 digits, you may be confusing it with another field
`,
  variations: ['123456', '789012', '345678', '901234', '567890'],
  validate: (value: string): boolean => {
    if (!value) return false;
    // Must be exactly 6 digits, no letters or special characters
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
    'Including letters from address or other fields',
    'Confusing parts of address with ID number',
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
 * Nationality extraction pattern
 */
export const NATIONALITY_PATTERN: FieldPattern = {
  field: 'nationalitate',
  description: 'Nationality (Cetățenie) extraction',
  pattern: /^[A-ZĂÂÎȘȚ\s]+$/,
  instructions: `
Extract the nationality (Cetățenie):
- Usually appears as "ROMÂNĂ / ROU" or other nationality in uppercase
- Extract only the first part before slash ("ROMÂNĂ")
- Common locations: Near the "CETĂȚENIE:" or "CETĂȚENIE" label on the ID
- Preserve exact spelling and diacritics
`,
  variations: ['ROMÂNĂ', 'MOLDOVEANĂ', 'UCRAINEANĂ', 'BULGARĂ', 'MAGHIARĂ'],
  validate: (value: string): boolean => {
    if (!value || value.trim().length < 2) return false;
    return true;
  },
  normalize: (value: string): string => {
    // If the value has a slash, take only the first part
    if (value.includes('/')) {
      const parts = value.split('/');
      return parts[0]?.trim().toUpperCase() || value.trim().toUpperCase();
    }
    return value.trim().toUpperCase();
  },
  commonErrors: [
    'Taking the first part and the slash',
    'Taking the second part after slash',
    'Missing diacritics',
    'Lowercase instead of uppercase',
  ],
};

/**
 * Sex extraction pattern
 */
export const SEX_PATTERN: FieldPattern = {
  field: 'sex',
  description: 'Sex (M/F) extraction',
  pattern: /^[MF]$/,
  instructions: `
Extract the sex/gender:
- Must be a single letter: "M" for male or "F" for female
- Common locations: Near the "SEX:" or "SEX" label on the ID
- MUST be consistent with the first digit of CNP:
  * If first CNP digit is odd (1,3,5,7): sex must be "M"
  * If first CNP digit is even (2,4,6,8): sex must be "F"
`,
  variations: ['M', 'F'],
  validate: (value: string): boolean => {
    if (!value) return false;
    return /^[MF]$/.test(value);
  },
  normalize: (value: string): string => {
    return value.trim().toUpperCase();
  },
  commonErrors: [
    'Extracting full word (Masculin/Feminin) instead of single letter',
    'Lowercase instead of uppercase',
    'Inconsistency with the CNP first digit',
  ],
};

/**
 * All field patterns for easy access
 */
export const FIELD_PATTERNS = {
  nume: NUME_PATTERN,
  prenume: PRENUME_PATTERN,
  cnp: CNP_PATTERN,
  nationalitate: NATIONALITY_PATTERN,
  sex: SEX_PATTERN,
  data_nasterii: DATE_PATTERN,
  locul_nasterii: BIRTH_PLACE_PATTERN,
  domiciliul: ADDRESS_PATTERN,
  tip_document: TIP_DOCUMENT_PATTERN,
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
  const suggestions: string[] = [];

  // Add field-specific validation
  for (const field in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, field)) {
      const typedField = field as keyof RomanianIDFields;
      const value = fields[typedField];

      if (value !== undefined) {
        addFieldSpecificValidation(
          typedField,
          value,
          errors,
          warnings,
          suggestions
        );
      }
    }
  }

  // Birth date must be extracted from CNP, never looked for on the card
  if (fields.data_nasterii && !fields.cnp) {
    warnings.push(
      'Birth date provided but no CNP - birth date should be derived from CNP'
    );
  }

  // Cross-validate CNP with birth date
  if (fields.cnp && fields.data_nasterii) {
    const cnpDate = extractDateFromCNP(fields.cnp);
    if (cnpDate && cnpDate !== fields.data_nasterii) {
      errors.push(
        `Birth date (${fields.data_nasterii}) does not match CNP-encoded date (${cnpDate}). CNP-encoded date must be used.`
      );
    }
  }

  // Cross-validate ID number format - must be exactly 6 digits
  if (fields.numar) {
    if (!/^\d{6}$/.test(fields.numar)) {
      errors.push(
        `ID number (${fields.numar}) must be exactly 6 digits with no letters or special characters`
      );
    }
  }

  // Cross-validate CNP with sex
  if (fields.cnp && fields.sex) {
    // Make sure CNP is treated as a string
    const cnp = String(fields.cnp);

    if (cnp.length > 0) {
      const firstDigit = parseInt(cnp.charAt(0), 10);
      if (!isNaN(firstDigit)) {
        const isMale = firstDigit % 2 === 1; // Odd first digit means male
        const expectedSex = isMale ? 'M' : 'F';

        if (fields.sex !== expectedSex) {
          errors.push(
            `CNP first digit (${cnp.charAt(0)}) indicates ${expectedSex} but sex field is ${fields.sex}`
          );
        }
      }
    }
  }

  // Cross-validate expiry date with birth date (from CNP) - day and month must match
  if (fields.cnp && fields.valabil_pana_la) {
    try {
      // Extract birth date from CNP
      const cnpDate = extractDateFromCNP(fields.cnp);

      if (cnpDate) {
        // Extract birth day and month
        const birthParts = cnpDate.split('.');
        if (birthParts.length === 3) {
          const birthDay = birthParts[0] ?? '';
          const birthMonth = birthParts[1] ?? '';

          // Extract expiry day and month
          const expiryParts = fields.valabil_pana_la.split('.');
          if (expiryParts.length === 3) {
            const expiryDay = expiryParts[0] ?? '';
            const expiryMonth = expiryParts[1] ?? '';

            if (birthDay !== expiryDay || birthMonth !== expiryMonth) {
              errors.push(
                `Expiry date day/month (${expiryDay}.${expiryMonth}) must match birth day/month from CNP (${birthDay}.${birthMonth})`
              );
            }
          }
        }
      }
    } catch (error) {
      // Skip validation if there's an error parsing dates
      warnings.push(
        'Could not validate day/month matching between birth date and expiry date'
      );
    }
  }

  // Validate series format - must be only letters
  if (fields.seria && !/^[A-Z]{1,3}$/.test(fields.seria)) {
    errors.push(
      `ID series (${fields.seria}) must contain only 1-3 uppercase letters, no digits or special characters`
    );
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

/**
 * Add field-specific validation rules
 */
function addFieldSpecificValidation(
  field: keyof RomanianIDFields,
  value: string | null,
  errors: string[],
  warnings: string[],
  _suggestions: string[]
): void {
  if (!value) return;

  switch (field) {
    case 'cnp':
      if (!/^\d{13}$/.test(value)) {
        errors.push('CNP must be exactly 13 digits');
      }
      break;

    case 'data_nasterii':
    case 'data_eliberarii':
    case 'valabil_pana_la':
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
        errors.push('Date must be in DD.MM.YYYY format');
      }
      break;

    case 'seria':
      if (!/^[A-Z]{1,3}$/.test(value)) {
        errors.push('Series must be exactly 2 uppercase letters (e.g., "XR")');
      }
      break;

    case 'numar':
      if (!/^\d{6}$/.test(value)) {
        errors.push('Number must be exactly 6 digits');
      }
      break;

    case 'nationalitate':
      if (value.length < 2) {
        errors.push('Nationality too short');
      }
      if (!/^[A-ZĂÂÎȘȚ\s]+$/.test(value)) {
        warnings.push('Nationality contains unexpected characters');
      }
      if (value.includes('/')) {
        warnings.push(
          'Nationality should contain only the first part before slash'
        );
      }
      break;

    case 'sex':
      if (!/^[MF]$/.test(value)) {
        errors.push('Sex must be "M" or "F"');
      }
      break;

    case 'nume':
      if (value.length < 2) {
        errors.push('Name too short');
      }
      if (!/^[A-ZĂÂÎȘȚ\s\-']+$/.test(value)) {
        warnings.push('Name contains unexpected characters');
      }
      break;

    case 'prenume':
      if (value.length < 2) {
        errors.push('Given name too short');
      }
      if (!/^[A-ZĂÂÎȘȚ\s\-']+$/.test(value)) {
        warnings.push('Given name contains unexpected characters');
      }
      break;

    case 'eliberat_de':
      if (!value.includes('SPC') && !value.includes('EVIDENTA')) {
        warnings.push('Authority name may be incomplete');
      }
      break;
  }
}
