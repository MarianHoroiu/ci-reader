/**
 * CNP (Personal Numeric Code) Utility Functions
 * Contains functions for validating and extracting information from Romanian CNP
 *
 * The CNP is the primary source of birth date information, as this information
 * is NOT visibly present on Romanian ID cards.
 */

/**
 * Extract birth date from CNP
 * CNP structure: SAALLZZJJNNNC where:
 * S - gender and century (1/2 for 1900-1999, 5/6 for 2000+)
 * AA - year of birth
 * LL - month of birth
 * ZZ - day of birth
 * JJ - county code
 * NNN - serial number
 * C - control digit
 *
 * Birth date is not present on Romanian ID cards and must be extracted from CNP.
 */
export function extractBirthDateFromCNP(cnp: string | null): string | null {
  if (!cnp || cnp.length !== 13 || !/^\d{13}$/.test(cnp)) {
    return null;
  }

  const firstDigit = parseInt(cnp.charAt(0), 10);
  const year = cnp.substring(1, 3);
  const month = cnp.substring(3, 5);
  const day = cnp.substring(5, 7);

  // Validate month and day first
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);

  if (monthNum < 1 || monthNum > 12) return null;

  // Determine century based on first digit
  let fullYear: string;
  if (firstDigit === 1 || firstDigit === 2) {
    fullYear = `19${year}`;
  } else if (firstDigit === 5 || firstDigit === 6) {
    fullYear = `20${year}`;
  } else if (firstDigit === 3 || firstDigit === 4) {
    fullYear = `18${year}`;
  } else if (firstDigit === 7 || firstDigit === 8) {
    // For residents with temporary ID
    fullYear = `19${year}`;
  } else {
    // Invalid first digit
    return null;
  }

  // Check days in month - using explicit if statements to avoid array access issues
  let maxDays: number;
  if (monthNum === 2) {
    // February special case
    const yearNum = parseInt(fullYear, 10);
    const isLeapYear =
      (yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0;
    maxDays = isLeapYear ? 29 : 28;
  } else if (
    monthNum === 4 ||
    monthNum === 6 ||
    monthNum === 9 ||
    monthNum === 11
  ) {
    // April, June, September, November have 30 days
    maxDays = 30;
  } else {
    // All other months have 31 days
    maxDays = 31;
  }

  if (dayNum < 1 || dayNum > maxDays) return null;

  // Return birth date in DD.MM.YYYY format
  return `${day}.${month}.${fullYear}`;
}

/**
 * Verify if a CNP-encoded birth date matches a given birth date string
 * This is critical for validating that data_nasterii matches what CNP encodes
 */
export function isBirthDateMatchingCNP(
  cnp: string | null,
  birthDate: string | null
): boolean {
  if (!cnp || !birthDate) return false;

  const cnpDate = extractBirthDateFromCNP(cnp);
  if (!cnpDate) return false;

  return cnpDate === birthDate;
}

/**
 * Extracts just the day and month from a date string in DD.MM.YYYY format
 */
export function extractDayMonth(dateString: string | null): string | null {
  if (!dateString || !/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return null;

  const parts = dateString.split('.');
  if (parts.length !== 3) return null;

  return `${parts[0]}.${parts[1]}`;
}

/**
 * Extract gender from CNP
 * First digit of CNP indicates gender and century:
 * - Odd digits (1,3,5,7): Male
 * - Even digits (2,4,6,8): Female
 */
export function extractGenderFromCNP(cnp: string | null): string | null {
  if (!cnp || cnp.length !== 13 || !/^\d{13}$/.test(cnp)) {
    return null;
  }

  const firstDigit = parseInt(cnp.charAt(0), 10);

  // Odd first digits (1, 3, 5, 7) are male
  // Even first digits (2, 4, 6, 8) are female
  if (firstDigit % 2 === 1) {
    return 'M';
  } else {
    return 'F';
  }
}

/**
 * Calculate expected expiry date based on birth date and issue date
 * Romanian ID cards expire on the holder's birthday 10 years after issuance
 *
 * The day and month of the expiry date must match the birth date (extracted from CNP),
 * and the year is typically 10 years after the issue date.
 */
export function calculateExpectedExpiryDate(
  birthDate: string | null,
  issueDate: string | null
): string | null {
  if (!birthDate || !issueDate) return null;

  // Parse dates (assuming DD.MM.YYYY format)
  const birthParts = birthDate.split('.');
  const issueParts = issueDate.split('.');

  if (birthParts.length !== 3 || issueParts.length !== 3) return null;

  try {
    // Use optional chaining and nullish coalescing to safely access array elements
    const birthDayStr = birthParts[0] ?? '';
    const birthMonthStr = birthParts[1] ?? '';
    const issueYearStr = issueParts[2] ?? '';

    const birthDay = parseInt(birthDayStr, 10);
    const birthMonth = parseInt(birthMonthStr, 10);
    const issueYear = parseInt(issueYearStr, 10);

    // Verify that the parsed values are valid numbers
    if (isNaN(birthDay) || isNaN(birthMonth) || isNaN(issueYear)) {
      return null;
    }

    // Expiry is on birth day and month, 10 years after issue
    const expiryYear = issueYear + 10;

    // Format with leading zeros
    const formattedDay = birthDay.toString().padStart(2, '0');
    const formattedMonth = birthMonth.toString().padStart(2, '0');

    return `${formattedDay}.${formattedMonth}.${expiryYear}`;
  } catch (error) {
    return null;
  }
}

/**
 * Validate that a CNP is properly formed according to the official Romanian algorithm
 * Based on the official validation method from Romanian authorities
 *
 * CNP structure: SAALLZZJJNNNC where:
 * S - gender and century (1/2 for 1900-1999, 5/6 for 2000+, etc.)
 * AA - year of birth
 * LL - month of birth
 * ZZ - day of birth
 * JJ - county code
 * NNN - serial number
 * C - control digit calculated using the constant key 279146358279
 */
export function validateCNP(cnp: string | null): boolean {
  if (!cnp || cnp.length !== 13 || !/^\d{13}$/.test(cnp)) {
    return false;
  }

  // First digit must be 1-8
  const firstDigit = parseInt(cnp.charAt(0), 10);
  if (firstDigit < 1 || firstDigit > 8) return false;

  // Validate year, month, day
  const year = parseInt(cnp.substring(1, 3), 10);
  const month = parseInt(cnp.substring(3, 5), 10);
  const day = parseInt(cnp.substring(5, 7), 10);

  // Basic date validation
  if (month < 1 || month > 12) return false;

  // Calculate maximum days for the month
  let maxDays: number;
  let fullYear: number;

  // Determine full year based on first digit
  if (firstDigit === 1 || firstDigit === 2) {
    fullYear = 1900 + year;
  } else if (firstDigit === 5 || firstDigit === 6) {
    fullYear = 2000 + year;
  } else if (firstDigit === 3 || firstDigit === 4) {
    fullYear = 1800 + year;
  } else {
    // 7 or 8
    fullYear = 1900 + year;
  }

  // Check days in month
  if (month === 2) {
    // February - check for leap year
    const isLeapYear =
      (fullYear % 4 === 0 && fullYear % 100 !== 0) || fullYear % 400 === 0;
    maxDays = isLeapYear ? 29 : 28;
  } else if ([4, 6, 9, 11].includes(month)) {
    maxDays = 30;
  } else {
    maxDays = 31;
  }

  if (day < 1 || day > maxDays) return false;

  // Validate county code (positions 8-9)
  const countyCode = parseInt(cnp.substring(7, 9), 10);
  // Valid county codes are 1-52, except 49-50 (reserved)
  if (
    countyCode < 1 ||
    countyCode > 52 ||
    countyCode === 49 ||
    countyCode === 50
  ) {
    return false;
  }

  // Validate check digit using the official algorithm with constant key 279146358279
  const controlKey = '279146358279';
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnp.charAt(i), 10) * parseInt(controlKey.charAt(i), 10);
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 1 : remainder;

  return checkDigit === parseInt(cnp.charAt(12), 10);
}

/**
 * Validate consistency between CNP, birth date, and sex
 *
 * Note: Birth date is not visible on Romanian ID cards and should be derived from CNP.
 * Sex field must be consistent with the CNP's first digit.
 */
export function validateCNPConsistency(
  cnp: string | null,
  birthDate: string | null,
  sex: string | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!cnp) {
    return { isValid: true, errors }; // Skip validation if CNP is not provided
  }

  // Validate CNP format
  if (!validateCNP(cnp)) {
    errors.push('Invalid CNP format or check digit');
    return { isValid: false, errors };
  }

  // Extract and validate birth date from CNP
  const extractedBirthDate = extractBirthDateFromCNP(cnp);
  if (birthDate && extractedBirthDate && birthDate !== extractedBirthDate) {
    errors.push(
      `Birth date (${birthDate}) does not match CNP-encoded date (${extractedBirthDate}). The birth date MUST match the CNP-encoded date since it's not visible on the ID card.`
    );
  }

  // Extract and validate gender from CNP
  const extractedGender = extractGenderFromCNP(cnp);
  if (sex && extractedGender && sex !== extractedGender) {
    errors.push(
      `Gender from CNP (${extractedGender}) does not match provided gender (${sex}). Gender must be consistent with the CNP's first digit.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates consistency between birth date, issue date, and expiry date
 *
 * In Romanian ID cards:
 * - Birth date is derived from CNP (not visible on the card)
 * - Expiry date must have the same day and month as birth date
 * - Expiry year is typically 10 years after issue year
 */
export function validateDateConsistency(
  birthDate: string | null,
  issueDate: string | null,
  expiryDate: string | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!birthDate || !issueDate || !expiryDate) {
    return { isValid: true, errors }; // Skip validation if any date is missing
  }

  // Validate date formats
  if (
    !/^\d{2}\.\d{2}\.\d{4}$/.test(birthDate) ||
    !/^\d{2}\.\d{2}\.\d{4}$/.test(issueDate) ||
    !/^\d{2}\.\d{2}\.\d{4}$/.test(expiryDate)
  ) {
    errors.push('One or more dates are not in the correct DD.MM.YYYY format');
    return { isValid: false, errors };
  }

  // Validate that expiry date has same day/month as birth date
  try {
    const birthParts = birthDate.split('.');
    const expiryParts = expiryDate.split('.');

    if (birthParts.length === 3 && expiryParts.length === 3) {
      if (
        birthParts[0] !== expiryParts[0] ||
        birthParts[1] !== expiryParts[1]
      ) {
        errors.push(
          `Expiry date day/month (${expiryParts[0]}.${expiryParts[1]}) does not match birth date day/month (${birthParts[0]}.${birthParts[1]}). Romanian ID cards expire on the holder's birth day.`
        );
      }
    }
  } catch (error) {
    // Skip validation if there's an error parsing dates
    errors.push(
      'Could not validate day/month matching between birth date and expiry date'
    );
  }

  // Calculate expected expiry date
  const expectedExpiryDate = calculateExpectedExpiryDate(birthDate, issueDate);

  if (expectedExpiryDate && expectedExpiryDate !== expiryDate) {
    errors.push(
      `Expiry date (${expiryDate}) does not match expected value (${expectedExpiryDate}) based on birth date and issue date. Expiry date should be the birth day/month, 10 years after issue date.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an entire Romanian ID data set for consistency
 * This function combines all validations into a single comprehensive check
 */
export function validateRomanianIDData(fields: {
  cnp?: string | null;
  data_nasterii?: string | null;
  sex?: string | null;
  data_eliberarii?: string | null;
  valabil_pana_la?: string | null;
  seria_buletin?: string | null;
  numar_buletin?: string | null;
}): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. CNP validation
  if (fields.cnp) {
    if (!validateCNP(fields.cnp)) {
      errors.push(
        `CNP (${fields.cnp}) is invalid according to the official Romanian algorithm`
      );
    }
  } else {
    warnings.push(
      'CNP is missing - it is a critical field for Romanian ID validation'
    );
  }

  // 2. Birth date from CNP validation
  if (fields.cnp && fields.data_nasterii) {
    const extractedDate = extractBirthDateFromCNP(fields.cnp);
    if (extractedDate && extractedDate !== fields.data_nasterii) {
      errors.push(
        `Birth date (${fields.data_nasterii}) doesn't match CNP-encoded date (${extractedDate})`
      );
    }
  }

  // 3. Sex consistency with CNP
  if (fields.cnp && fields.sex) {
    const extractedSex = extractGenderFromCNP(fields.cnp);
    if (extractedSex && extractedSex !== fields.sex) {
      errors.push(
        `Sex (${fields.sex}) doesn't match CNP-encoded sex (${extractedSex})`
      );
    }
  }

  // 4. ID number format validation
  if (fields.numar_buletin) {
    if (!/^\d{6}$/.test(fields.numar_buletin)) {
      errors.push(
        `ID number (${fields.numar_buletin}) must be exactly 6 digits`
      );
    }
  }

  // 5. Series format validation
  if (fields.seria_buletin) {
    if (!/^[A-Z]{1,2}$/.test(fields.seria_buletin)) {
      errors.push(
        `ID series (${fields.seria_buletin}) must be 1 or 2 uppercase letters only`
      );
    }
  }

  // 6. Expiry date consistency
  if (fields.data_nasterii && fields.valabil_pana_la) {
    const birthDayMonth = extractDayMonth(fields.data_nasterii);
    const expiryDayMonth = extractDayMonth(fields.valabil_pana_la);

    if (birthDayMonth && expiryDayMonth && birthDayMonth !== expiryDayMonth) {
      errors.push(
        `Expiry date day/month (${expiryDayMonth}) doesn't match birth date day/month (${birthDayMonth})`
      );
    }
  }

  // 7. Issue date vs expiry date logic
  if (
    fields.data_eliberarii &&
    fields.valabil_pana_la &&
    fields.data_nasterii
  ) {
    const expectedExpiry = calculateExpectedExpiryDate(
      fields.data_nasterii,
      fields.data_eliberarii
    );
    if (expectedExpiry && expectedExpiry !== fields.valabil_pana_la) {
      errors.push(
        `Expiry date (${fields.valabil_pana_la}) doesn't match expected value (${expectedExpiry})`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
