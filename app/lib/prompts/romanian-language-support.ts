/**
 * Romanian Language Support for ID Document Processing
 * Handles Romanian diacritics, character patterns, and language-specific text processing
 */

// Romanian diacritical characters mapping
export const ROMANIAN_DIACRITICS = {
  // Standard Romanian diacritics
  ă: 'a',
  â: 'a',
  î: 'i',
  ș: 's',
  ț: 't',
  Ă: 'A',
  Â: 'A',
  Î: 'I',
  Ș: 'S',
  Ț: 'T',
} as const;

// Reverse mapping for restoring diacritics
export const DIACRITIC_RESTORATION = {
  a: ['ă', 'â'],
  A: ['Ă', 'Â'],
  i: ['î'],
  I: ['Î'],
  s: ['ș'],
  S: ['Ș'],
  t: ['ț'],
  T: ['Ț'],
} as const;

// Common Romanian words and patterns for context-based correction
export const ROMANIAN_PATTERNS = {
  // Common Romanian names
  commonSurnames: [
    'POPESCU',
    'IONESCU',
    'POPA',
    'STAN',
    'STOICA',
    'GHEORGHE',
    'MUNTEANU',
    'TUDOR',
    'DIMA',
    'TOMA',
    'RUSU',
    'MARIN',
    'CONSTANTIN',
    'RADU',
    'CRISTEA',
    'MATEI',
    'NICULESCU',
    'VASILE',
    'FLOREA',
    'DUMITRESCU',
  ],

  commonFirstNames: [
    'MARIA',
    'ELENA',
    'IOANA',
    'ALEXANDRA',
    'CRISTINA',
    'ANDREEA',
    'MIHAELA',
    'ION',
    'GHEORGHE',
    'NICOLAE',
    'VASILE',
    'CONSTANTIN',
    'MARIAN',
    'ADRIAN',
    'ȘTEFAN',
    'CĂTĂLIN',
    'BOGDAN',
    'DANIEL',
    'ALEXANDRU',
    'CRISTIAN',
  ],

  // Romanian cities and counties
  majorCities: [
    'BUCUREȘTI',
    'CLUJ-NAPOCA',
    'TIMIȘOARA',
    'IAȘI',
    'CONSTANȚA',
    'CRAIOVA',
    'BRAȘOV',
    'GALAȚI',
    'PLOIEȘTI',
    'ORADEA',
    'BRAILA',
    'ARAD',
    'PITEȘTI',
    'SIBIU',
    'BACĂU',
    'TÂRGU MUREȘ',
    'BAIA MARE',
    'BUZĂU',
    'BOTOȘANI',
  ],

  // Address abbreviations
  addressAbbreviations: [
    'STR.',
    'STRADA',
    'NR.',
    'NUMĂRUL',
    'BL.',
    'BLOCUL',
    'AP.',
    'APARTAMENTUL',
    'SC.',
    'SCARA',
    'ET.',
    'ETAJUL',
    'CALEA',
    'BDUL',
    'BULEVARDUL',
    'PIAȚA',
  ],

  // Authority patterns
  authorityPatterns: [
    'SPCLEP',
    'SERVICIUL PUBLIC COMUNITAR LOCAL',
    'EVIDENȚA PERSOANELOR',
    'PRIMĂRIA',
    'CONSILIUL LOCAL',
  ],
};

/**
 * Normalize Romanian text by removing diacritics
 */
export function removeDiacritics(text: string): string {
  let normalized = text;

  Object.entries(ROMANIAN_DIACRITICS).forEach(([diacritic, base]) => {
    normalized = normalized.replace(new RegExp(diacritic, 'g'), base);
  });

  return normalized;
}

/**
 * Restore Romanian diacritics based on context and common patterns
 */
export function restoreDiacritics(text: string): string {
  let restored = text;

  // Apply context-based diacritic restoration
  restored = restoreNameDiacritics(restored);
  restored = restoreCityDiacritics(restored);
  restored = restoreAddressDiacritics(restored);

  return restored;
}

/**
 * Restore diacritics in Romanian names
 */
function restoreNameDiacritics(text: string): string {
  let restored = text;

  // Common name patterns with diacritics
  const namePatterns = [
    { pattern: /STEFAN/g, replacement: 'ȘTEFAN' },
    { pattern: /CATALIN/g, replacement: 'CĂTĂLIN' },
    { pattern: /BOGDAN/g, replacement: 'BOGDAN' }, // No change needed
    { pattern: /RAZVAN/g, replacement: 'RĂZVAN' },
    { pattern: /MARIAN/g, replacement: 'MARIAN' }, // Context dependent
    { pattern: /ADRIAN/g, replacement: 'ADRIAN' }, // No change needed
    { pattern: /FLORIN/g, replacement: 'FLORIN' }, // No change needed
    { pattern: /CALIN/g, replacement: 'CĂLIN' },
    { pattern: /DRAGOS/g, replacement: 'DRAGOȘ' },
    { pattern: /ANDREI/g, replacement: 'ANDREI' }, // No change needed
  ];

  namePatterns.forEach(({ pattern, replacement }) => {
    restored = restored.replace(pattern, replacement);
  });

  return restored;
}

/**
 * Restore diacritics in Romanian city names
 */
function restoreCityDiacritics(text: string): string {
  let restored = text;

  // City name patterns with diacritics
  const cityPatterns = [
    { pattern: /BRASOV/g, replacement: 'BRAȘOV' },
    { pattern: /CONSTANTA/g, replacement: 'CONSTANȚA' },
    { pattern: /TARGU MURES/g, replacement: 'TÂRGU MUREȘ' },
    { pattern: /TARGU-MURES/g, replacement: 'TÂRGU-MUREȘ' },
    { pattern: /BOTOSANI/g, replacement: 'BOTOȘANI' },
    { pattern: /RESITA/g, replacement: 'REȘIȚA' },
    { pattern: /DROBETA-TURNU SEVERIN/g, replacement: 'DROBETA-TURNU SEVERIN' },
    { pattern: /SLATINA/g, replacement: 'SLATINA' }, // No change needed
    { pattern: /RAMNICU VALCEA/g, replacement: 'RÂMNICU VÂLCEA' },
    { pattern: /PIATRA NEAMT/g, replacement: 'PIATRA NEAMȚ' },
  ];

  cityPatterns.forEach(({ pattern, replacement }) => {
    restored = restored.replace(pattern, replacement);
  });

  return restored;
}

/**
 * Restore diacritics in address components
 */
function restoreAddressDiacritics(text: string): string {
  let restored = text;

  // Address patterns with diacritics
  const addressPatterns = [
    { pattern: /DOROBANTILOR/g, replacement: 'DOROBANȚILOR' },
    { pattern: /VICTORIEI/g, replacement: 'VICTORIEI' }, // No change needed
    { pattern: /REPUBLICII/g, replacement: 'REPUBLICII' }, // No change needed
    { pattern: /LIBERTATII/g, replacement: 'LIBERTĂȚII' },
    { pattern: /UNIRII/g, replacement: 'UNIRII' }, // No change needed
    { pattern: /MIHAI VITEAZU/g, replacement: 'MIHAI VITEAZU' }, // No change needed
    { pattern: /STEFAN CEL MARE/g, replacement: 'ȘTEFAN CEL MARE' },
    { pattern: /CALEA NATIONALA/g, replacement: 'CALEA NAȚIONALĂ' },
  ];

  addressPatterns.forEach(({ pattern, replacement }) => {
    restored = restored.replace(pattern, replacement);
  });

  return restored;
}

/**
 * Validate Romanian text for proper diacritic usage
 */
export function validateRomanianText(text: string): {
  isValid: boolean;
  suggestions: string[];
  confidence: number;
} {
  const suggestions: string[] = [];
  let confidence = 1.0;

  // Check for missing diacritics in common words
  const withoutDiacritics = removeDiacritics(text);
  const withDiacritics = restoreDiacritics(withoutDiacritics);

  if (text !== withDiacritics) {
    suggestions.push(`Consider: ${withDiacritics}`);
    confidence *= 0.8;
  }

  // Check for common OCR errors
  const ocrErrors = detectOCRErrors(text);
  if (ocrErrors.length > 0) {
    suggestions.push(...ocrErrors);
    confidence *= 0.7;
  }

  return {
    isValid: suggestions.length === 0,
    suggestions,
    confidence,
  };
}

/**
 * Detect common OCR errors in Romanian text
 */
function detectOCRErrors(text: string): string[] {
  const errors: string[] = [];

  // Common OCR character confusions
  const ocrPatterns = [
    { error: /0/g, correct: 'O', context: /[A-Z]0[A-Z]/ },
    { error: /O/g, correct: '0', context: /\d+O\d+/ },
    { error: /1/g, correct: 'I', context: /[A-Z]1[A-Z]/ },
    { error: /I/g, correct: '1', context: /\d+I\d+/ },
    { error: /5/g, correct: 'S', context: /[A-Z]5[A-Z]/ },
    { error: /S/g, correct: '5', context: /\d+S\d+/ },
  ];

  ocrPatterns.forEach(({ error, correct, context }) => {
    if (context.test(text)) {
      const corrected = text.replace(error, correct);
      if (corrected !== text) {
        errors.push(`OCR correction: ${corrected}`);
      }
    }
  });

  return errors;
}

/**
 * Generate Romanian-specific extraction hints for prompts
 */
export function generateRomanianHints(): string {
  return `
ROMANIAN LANGUAGE SPECIFICS:

DIACRITICAL MARKS:
- ă (a-breve): Used in words like "română", "băiat", "mănânc"
- â (a-circumflex): Used in words like "român", "înțelege", "câine"  
- î (i-circumflex): Used in words like "înainte", "înalt", "împreună"
- ș (s-comma): Used in words like "școală", "ștefan", "oraș"
- ț (t-comma): Used in words like "țară", "națiune", "centru"

COMMON NAME PATTERNS:
- Surnames: ${ROMANIAN_PATTERNS.commonSurnames.slice(0, 10).join(', ')}
- First names: ${ROMANIAN_PATTERNS.commonFirstNames.slice(0, 10).join(', ')}

MAJOR CITIES:
- ${ROMANIAN_PATTERNS.majorCities.slice(0, 10).join(', ')}

ADDRESS ABBREVIATIONS:
- ${ROMANIAN_PATTERNS.addressAbbreviations.join(', ')}

AUTHORITY PATTERNS:
- ${ROMANIAN_PATTERNS.authorityPatterns.join(', ')}

CHARACTER RECOGNITION TIPS:
- Distinguish ă from a (breve accent)
- Distinguish â from a (circumflex accent)
- Distinguish ș from s (comma below)
- Distinguish ț from t (comma below)
- Watch for OCR confusion: 0/O, 1/I, 5/S in mixed contexts
`;
}

/**
 * Create a Romanian-aware prompt enhancement
 */
export function enhancePromptWithRomanian(basePrompt: string): string {
  const romanianHints = generateRomanianHints();

  return `${basePrompt}

${romanianHints}

ROMANIAN TEXT PROCESSING INSTRUCTIONS:
1. Preserve all diacritical marks exactly as they appear
2. If diacritics are unclear, use context from common Romanian words
3. Apply Romanian language patterns for validation
4. Consider OCR character confusion in mixed alphanumeric contexts
5. Validate names and places against common Romanian patterns
`;
}

/**
 * Post-process extracted text with Romanian language corrections
 */
export function postProcessRomanianText(
  text: string,
  fieldType: 'name' | 'address' | 'city' | 'authority' | 'general'
): string {
  let processed = text.trim();

  // Apply field-specific processing
  switch (fieldType) {
    case 'name':
      processed = restoreNameDiacritics(processed);
      break;
    case 'city':
      processed = restoreCityDiacritics(processed);
      break;
    case 'address':
      processed = restoreAddressDiacritics(processed);
      break;
    case 'authority':
      // Authority names are usually standardized
      processed = processed.toUpperCase();
      break;
    default:
      processed = restoreDiacritics(processed);
  }

  // Clean up spacing
  processed = processed.replace(/\s+/g, ' ').trim();

  return processed;
}

/**
 * Calculate confidence score for Romanian text recognition
 */
export function calculateRomanianConfidence(
  text: string,
  fieldType: 'name' | 'address' | 'city' | 'authority' | 'general'
): number {
  let confidence = 1.0;

  // Check for proper diacritic usage
  const validation = validateRomanianText(text);
  confidence *= validation.confidence;

  // Field-specific confidence adjustments
  switch (fieldType) {
    case 'name': {
      // Check against common Romanian names
      const hasCommonName =
        ROMANIAN_PATTERNS.commonSurnames.some(name => text.includes(name)) ||
        ROMANIAN_PATTERNS.commonFirstNames.some(name => text.includes(name));
      if (hasCommonName) confidence *= 1.1;
      break;
    }

    case 'city': {
      // Check against major Romanian cities
      const hasKnownCity = ROMANIAN_PATTERNS.majorCities.some(city =>
        text.includes(city)
      );
      if (hasKnownCity) confidence *= 1.2;
      break;
    }

    case 'address': {
      // Check for address abbreviations
      const hasAddressPattern = ROMANIAN_PATTERNS.addressAbbreviations.some(
        abbr => text.includes(abbr)
      );
      if (hasAddressPattern) confidence *= 1.1;
      break;
    }

    case 'authority': {
      // Check for authority patterns
      const hasAuthorityPattern = ROMANIAN_PATTERNS.authorityPatterns.some(
        pattern => text.includes(pattern)
      );
      if (hasAuthorityPattern) confidence *= 1.2;
      break;
    }
  }

  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}
