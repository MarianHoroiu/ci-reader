/**
 * Romanian character definitions and validation utilities
 * Handles special Romanian characters and text validation
 */

// Romanian special characters
export const ROMANIAN_SPECIAL_CHARS = {
  // Lowercase
  a_breve: 'ă',
  a_circumflex: 'â',
  i_circumflex: 'î',
  s_comma: 'ș',
  t_comma: 'ț',

  // Uppercase
  A_BREVE: 'Ă',
  A_CIRCUMFLEX: 'Â',
  I_CIRCUMFLEX: 'Î',
  S_COMMA: 'Ș',
  T_COMMA: 'Ț',
} as const;

// All Romanian special characters as array
export const ROMANIAN_SPECIAL_CHARS_ARRAY = Object.values(
  ROMANIAN_SPECIAL_CHARS
);

// Romanian alphabet including special characters
export const ROMANIAN_ALPHABET = [
  'a',
  'ă',
  'â',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'î',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  'ș',
  't',
  'ț',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'A',
  'Ă',
  'Â',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'Î',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'Ș',
  'T',
  'Ț',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

// Common character substitutions for OCR errors
export const ROMANIAN_CHAR_SUBSTITUTIONS = {
  // Common OCR misrecognitions for Romanian characters
  ă: ['a', 'à', 'á', 'ã'],
  â: ['a', 'à', 'á', 'ã', 'ä'],
  î: ['i', 'ì', 'í', 'ï'],
  ș: ['s', 'š', 'ş'],
  ț: ['t', 'ţ'],
  Ă: ['A', 'À', 'Á', 'Ã'],
  Â: ['A', 'À', 'Á', 'Ã', 'Ä'],
  Î: ['I', 'Ì', 'Í', 'Ï'],
  Ș: ['S', 'Š', 'Ş'],
  Ț: ['T', 'Ţ'],
} as const;

// Reverse mapping for corrections
export const CHAR_CORRECTION_MAP = new Map<string, string>();

// Build reverse mapping
Object.entries(ROMANIAN_CHAR_SUBSTITUTIONS).forEach(
  ([correct, alternatives]) => {
    alternatives.forEach(alt => {
      CHAR_CORRECTION_MAP.set(alt, correct);
    });
  }
);

// Romanian ID document specific character whitelist
export const ROMANIAN_ID_CHAR_WHITELIST = [
  ...ROMANIAN_ALPHABET,
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  ' ',
  '.',
  ',',
  '-',
  '/',
  '\\',
  '(',
  ')',
  '[',
  ']',
  ':',
  ';',
  "'",
  '"',
  '&',
  '+',
  '=',
  '_',
  '@',
  '#',
].join('');

// Common Romanian words found on ID documents
export const ROMANIAN_ID_KEYWORDS = [
  'ROMANIA',
  'CARTE',
  'IDENTITATE',
  'NUME',
  'PRENUME',
  'PRENUMELE',
  'TATĂLUI',
  'MAMEI',
  'NĂSCUT',
  'NĂSCUTĂ',
  'DATA',
  'NAȘTERII',
  'LOCUL',
  'NAȘTERII',
  'DOMICILIUL',
  'SERIA',
  'NUMĂRUL',
  'CNP',
  'ELIBERAT',
  'VALABIL',
  'PÂNĂ',
  'CETĂȚENIA',
  'ROMÂNĂ',
  'MASCULIN',
  'FEMININ',
  'JUDEȚUL',
  'MUNICIPIUL',
  'ORAȘUL',
  'COMUNA',
  'SATUL',
  'STRADA',
  'ALEEA',
  'BULEVARDUL',
  'PIAȚA',
  'NUMĂRUL',
  'BLOC',
  'SCARA',
  'ETAJ',
  'APARTAMENT',
];

// Romanian county codes (județe)
export const ROMANIAN_COUNTIES = {
  AB: 'Alba',
  AR: 'Arad',
  AG: 'Argeș',
  BC: 'Bacău',
  BH: 'Bihor',
  BN: 'Bistrița-Năsăud',
  BT: 'Botoșani',
  BV: 'Brașov',
  BR: 'Brăila',
  BZ: 'Buzău',
  CS: 'Caraș-Severin',
  CL: 'Călărași',
  CJ: 'Cluj',
  CT: 'Constanța',
  CV: 'Covasna',
  DB: 'Dâmbovița',
  DJ: 'Dolj',
  GL: 'Galați',
  GR: 'Giurgiu',
  GJ: 'Gorj',
  HR: 'Harghita',
  HD: 'Hunedoara',
  IL: 'Ialomița',
  IS: 'Iași',
  IF: 'Ilfov',
  MM: 'Maramureș',
  MH: 'Mehedinți',
  MS: 'Mureș',
  NT: 'Neamț',
  OT: 'Olt',
  PH: 'Prahova',
  SM: 'Satu Mare',
  SJ: 'Sălaj',
  SB: 'Sibiu',
  SV: 'Suceava',
  TR: 'Teleorman',
  TM: 'Timiș',
  TL: 'Tulcea',
  VS: 'Vaslui',
  VL: 'Vâlcea',
  VN: 'Vrancea',
  B: 'București',
} as const;

/**
 * Validates if a string contains only valid Romanian characters
 */
export function isValidRomanianText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  return text
    .split('')
    .every(
      char => ROMANIAN_ALPHABET.includes(char) || /[\d\s\p{P}]/u.test(char)
    );
}

/**
 * Corrects common OCR errors in Romanian text
 */
export function correctRomanianText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let corrected = text;

  // Apply character corrections
  CHAR_CORRECTION_MAP.forEach((correct, incorrect) => {
    const regex = new RegExp(incorrect, 'g');
    corrected = corrected.replace(regex, correct);
  });

  return corrected;
}

/**
 * Extracts Romanian special characters from text
 */
export function extractRomanianChars(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  return text
    .split('')
    .filter(char => ROMANIAN_SPECIAL_CHARS_ARRAY.includes(char as any));
}

/**
 * Validates Romanian county code
 */
export function isValidCountyCode(code: string): boolean {
  return Object.keys(ROMANIAN_COUNTIES).includes(code.toUpperCase());
}

/**
 * Gets county name from code
 */
export function getCountyName(code: string): string | null {
  const upperCode = code.toUpperCase();
  if (upperCode in ROMANIAN_COUNTIES) {
    return ROMANIAN_COUNTIES[upperCode as keyof typeof ROMANIAN_COUNTIES];
  }
  return null;
}

/**
 * Validates Romanian CNP (Personal Numeric Code)
 */
export function isValidCNP(cnp: string): boolean {
  if (!cnp || typeof cnp !== 'string') return false;

  // Remove any non-digit characters
  const cleanCNP = cnp.replace(/\D/g, '');

  // CNP must be exactly 13 digits
  if (cleanCNP.length !== 13) return false;

  // Validate checksum
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNP[i] || '0') * (weights[i] || 0);
  }

  const checkDigit = sum % 11;
  const expectedCheckDigit = checkDigit < 10 ? checkDigit : 1;

  return parseInt(cleanCNP[12] || '0') === expectedCheckDigit;
}

/**
 * Extracts information from Romanian CNP
 */
export function parseCNP(cnp: string): {
  isValid: boolean;
  gender?: 'M' | 'F';
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  countyCode?: string;
} {
  if (!isValidCNP(cnp)) {
    return { isValid: false };
  }

  const cleanCNP = cnp.replace(/\D/g, '');

  const genderDigit = parseInt(cleanCNP[0] || '0');
  const year = parseInt(cleanCNP.substring(1, 3) || '0');
  const month = parseInt(cleanCNP.substring(3, 5) || '0');
  const day = parseInt(cleanCNP.substring(5, 7) || '0');
  const countyCode = cleanCNP.substring(7, 9);

  // Determine gender and century
  let gender: 'M' | 'F';
  let birthYear: number;

  if (genderDigit === 1 || genderDigit === 2) {
    // Born 1900-1999
    gender = genderDigit === 1 ? 'M' : 'F';
    birthYear = 1900 + year;
  } else if (genderDigit === 3 || genderDigit === 4) {
    // Born 1800-1899
    gender = genderDigit === 3 ? 'M' : 'F';
    birthYear = 1800 + year;
  } else if (genderDigit === 5 || genderDigit === 6) {
    // Born 2000-2099
    gender = genderDigit === 5 ? 'M' : 'F';
    birthYear = 2000 + year;
  } else {
    return { isValid: false };
  }

  return {
    isValid: true,
    gender,
    birthYear,
    birthMonth: month,
    birthDay: day,
    countyCode,
  };
}
