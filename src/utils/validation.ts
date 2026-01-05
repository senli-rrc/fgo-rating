/**
 * Input Validation and Sanitization Utilities
 * Protects against XSS, SSRF, and malicious input
 */

// ============================================
// URL VALIDATION AND SANITIZATION
// ============================================

/**
 * Allowed domains for external resources
 * Whitelist approach prevents SSRF attacks
 */
const ALLOWED_DOMAINS = [
  'api.atlasacademy.io',      // Atlas Academy API
  'static.atlasacademy.io',   // Atlas static resources
  'assets.atlasacademy.io',   // Atlas assets
  'picsum.photos',            // Placeholder images (dev only)
  'localhost',                // Local development
  '127.0.0.1',                // Local development
  // Add your CDN/image hosting domains here
];

/**
 * URL protocols whitelist
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Validates and sanitizes URLs to prevent SSRF attacks
 * @param url - URL string to validate
 * @param allowedDomains - Optional custom domain whitelist
 * @returns Validated URL or null if invalid
 */
export function validateUrl(url: string, allowedDomains: string[] = ALLOWED_DOMAINS): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim and remove dangerous characters
  const trimmedUrl = url.trim();

  // Check for obvious malicious patterns
  if (trimmedUrl.includes('<') || trimmedUrl.includes('>') || trimmedUrl.includes('javascript:')) {
    console.warn('[Security] Blocked potentially malicious URL:', trimmedUrl);
    return null;
  }

  try {
    const urlObj = new URL(trimmedUrl);

    // Validate protocol
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      console.warn('[Security] Blocked non-HTTP(S) protocol:', urlObj.protocol);
      return null;
    }

    // Validate domain (whitelist approach)
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = allowedDomains.some(domain => {
      // Exact match or subdomain match
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });

    if (!isAllowed) {
      console.warn('[Security] Blocked URL from non-whitelisted domain:', hostname);
      return null;
    }

    // Return sanitized URL (reconstructed from URL object)
    return urlObj.toString();
  } catch (error) {
    console.warn('[Security] Invalid URL format:', trimmedUrl);
    return null;
  }
}

// ============================================
// TEXT INPUT SANITIZATION
// ============================================

/**
 * Sanitizes text input to prevent XSS and excessive content
 * @param input - Raw text input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized text
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes and other control characters (except newlines/tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML tags (defense in depth - React already escapes)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  return sanitized;
}

/**
 * Validates username format
 * @param username - Username to validate
 * @returns true if valid, false otherwise
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false;
  }

  const trimmed = username.trim();

  // Length: 3-30 characters
  if (trimmed.length < 3 || trimmed.length > 30) {
    return false;
  }

  // Only alphanumeric, underscore, hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(trimmed);
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim();

  // Basic email regex (not perfect but good enough)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) && trimmed.length <= 255;
}

/**
 * Sanitizes comment/review text
 * @param comment - Comment text
 * @returns Sanitized comment
 */
export function sanitizeComment(comment: string): string {
  return sanitizeText(comment, 5000); // Max 5000 chars for comments
}

// ============================================
// NUMBER VALIDATION
// ============================================

/**
 * Validates and sanitizes numeric input
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validated number or null if invalid
 */
export function validateNumber(value: any, min: number = -Infinity, max: number = Infinity): number | null {
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Validates servant rating score
 * @param score - Score to validate
 * @returns Validated score (1-10) or null
 */
export function validateRating(score: any): number | null {
  return validateNumber(score, 1, 10);
}

/**
 * Validates servant rarity
 * @param rarity - Rarity to validate
 * @returns Validated rarity (0-5) or null
 */
export function validateRarity(rarity: any): number | null {
  return validateNumber(rarity, 0, 5);
}

// ============================================
// ENUM VALIDATION
// ============================================

/**
 * Validates value against allowed enum values
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @returns Validated value or null
 */
export function validateEnum<T>(value: any, allowedValues: T[]): T | null {
  if (allowedValues.includes(value)) {
    return value;
  }
  return null;
}

/**
 * Validates server region
 * @param server - Server to validate
 * @returns Validated server or null
 */
export function validateServer(server: string): 'JP' | 'CN' | 'EN' | null {
  return validateEnum(server, ['JP', 'CN', 'EN']);
}

/**
 * Validates class name
 * @param className - Class name to validate
 * @returns Validated class name or null
 */
export function validateClassName(className: string): string | null {
  const validClasses = [
    'Saber', 'Archer', 'Lancer', 'Rider', 'Caster', 'Assassin', 'Berserker',
    'Shielder', 'Ruler', 'Avenger', 'Alterego', 'MoonCancer', 'Foreigner', 'Pretender', 'Beast'
  ];
  return validateEnum(className, validClasses);
}

// ============================================
// SERVANT DATA VALIDATION
// ============================================

/**
 * Validates servant form data before submission
 * @param servant - Servant data to validate
 * @returns Validation result with errors
 */
export function validateServantData(servant: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!servant.name || sanitizeText(servant.name).length === 0) {
    errors.push('Name is required');
  }

  if (!servant.className || !validateClassName(servant.className)) {
    errors.push('Valid class name is required');
  }

  if (validateRarity(servant.rarity) === null) {
    errors.push('Rarity must be between 0 and 5');
  }

  if (!servant.collectionNo || validateNumber(servant.collectionNo, 1, 999999) === null) {
    errors.push('Valid collection number is required');
  }

  // Validate stats (if provided)
  if (servant.atkMax !== undefined && validateNumber(servant.atkMax, 0, 99999) === null) {
    errors.push('Attack Max must be a valid number');
  }

  if (servant.hpMax !== undefined && validateNumber(servant.hpMax, 0, 99999) === null) {
    errors.push('HP Max must be a valid number');
  }

  // Validate URLs (if provided)
  if (servant.face && !validateUrl(servant.face)) {
    errors.push('Face image URL is invalid or from untrusted domain');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// EXPORT VALIDATION SUMMARY
// ============================================

export const validation = {
  url: validateUrl,
  text: sanitizeText,
  username: validateUsername,
  email: validateEmail,
  comment: sanitizeComment,
  number: validateNumber,
  rating: validateRating,
  rarity: validateRarity,
  enum: validateEnum,
  server: validateServer,
  className: validateClassName,
  servantData: validateServantData,
  ALLOWED_DOMAINS,
  ALLOWED_PROTOCOLS
};

export default validation;
