/**
 * Input validation utilities for secure user input handling
 *
 * Provides validation and sanitization functions to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - Invalid/malformed input
 * - Out-of-range values
 */

/**
 * Validation result with sanitized value or error message
 */
export interface ValidationResult<T> {
  isValid: boolean;
  sanitized: T | null;
  error?: string;
}

/**
 * Validates and sanitizes a numeric input string
 *
 * Ensures the input:
 * - Contains only digits
 * - Is a valid integer
 * - Falls within the specified range [min, max]
 *
 * @param value - Input string to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @returns Validation result with sanitized number or error
 *
 * @example
 * ```ts
 * const result = validateNumberInput('42', 1, 100);
 * if (result.isValid) {
 *   console.log(result.sanitized); // 42
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateNumberInput(
  value: string,
  min: number,
  max: number
): ValidationResult<number> {
  // Check for empty string
  if (value.trim() === '') {
    return { isValid: false, sanitized: null, error: '값을 입력해주세요' };
  }

  // Only allow digits (no decimals, minus signs, or special characters)
  if (!/^\d+$/.test(value)) {
    return { isValid: false, sanitized: null, error: '숫자만 입력 가능합니다' };
  }

  const num = parseInt(value, 10);

  // Check for NaN (should not happen with regex check, but safety first)
  if (isNaN(num)) {
    return { isValid: false, sanitized: null, error: '유효하지 않은 숫자입니다' };
  }

  // Check for integer
  if (!Number.isInteger(num)) {
    return { isValid: false, sanitized: null, error: '정수만 입력 가능합니다' };
  }

  // Range validation
  if (num < min || num > max) {
    return {
      isValid: false,
      sanitized: null,
      error: `${String(min)}-${String(max)} 범위의 숫자를 입력하세요`,
    };
  }

  return { isValid: true, sanitized: num };
}

/**
 * Sanitizes text input to prevent XSS attacks
 *
 * Escapes HTML special characters:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#x27;
 *
 * Also trims whitespace and limits length.
 *
 * @param text - Text to sanitize
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized text
 *
 * @example
 * ```ts
 * const safe = sanitizeCustomItem('<script>alert("xss")</script>');
 * // Result: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 * ```
 */
export function sanitizeCustomItem(text: string, maxLength = 100): string {
  // Trim whitespace
  let sanitized = text.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Escape HTML special characters to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;'); // Forward slash (for </script>)

  return sanitized;
}

/**
 * Validates custom item text
 *
 * Checks:
 * - Not empty after trimming
 * - Length within limits
 * - No dangerous patterns (script tags, etc.)
 *
 * @param text - Text to validate
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (default: 100)
 * @returns Validation result with sanitized text
 *
 * @example
 * ```ts
 * const result = validateCustomItem('사과');
 * if (result.isValid) {
 *   console.log(result.sanitized); // "사과"
 * }
 * ```
 */
export function validateCustomItem(
  text: string,
  minLength = 1,
  maxLength = 100
): ValidationResult<string> {
  const trimmed = text.trim();

  // Check empty
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: null, error: '항목을 입력해주세요' };
  }

  // Check length
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      sanitized: null,
      error: `최소 ${String(minLength)}자 이상 입력해주세요`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      sanitized: null,
      error: `최대 ${String(maxLength)}자까지 입력 가능합니다`,
    };
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        sanitized: null,
        error: '허용되지 않는 문자가 포함되어 있습니다',
      };
    }
  }

  // Sanitize and return
  const sanitized = sanitizeCustomItem(trimmed, maxLength);
  return { isValid: true, sanitized };
}

/**
 * Validates a list of custom items
 *
 * @param items - Array of items to validate
 * @param minItems - Minimum number of items (default: 2)
 * @param maxItems - Maximum number of items (default: 100)
 * @returns Validation result with sanitized items array
 *
 * @example
 * ```ts
 * const result = validateCustomItemsList(['사과', '바나나', '포도']);
 * if (result.isValid) {
 *   console.log(result.sanitized); // ["사과", "바나나", "포도"]
 * }
 * ```
 */
export function validateCustomItemsList(
  items: unknown,
  minItems = 2,
  maxItems = 100
): ValidationResult<string[]> {
  // Check array is provided
  if (!Array.isArray(items)) {
    return {
      isValid: false,
      sanitized: null,
      error: '유효하지 않은 항목 목록입니다',
    };
  }

  const candidates: unknown[] = items;

  // Check count
  if (candidates.length < minItems) {
    return {
      isValid: false,
      sanitized: null,
      error: `최소 ${String(minItems)}개 이상의 항목이 필요합니다`,
    };
  }

  if (candidates.length > maxItems) {
    return {
      isValid: false,
      sanitized: null,
      error: `최대 ${String(maxItems)}개까지 추가 가능합니다`,
    };
  }

  // Validate and sanitize each item
  const sanitized: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    if (typeof item !== 'string')
      return {
        isValid: false,
        sanitized: null,
        error: `항목 ${String(i + 1)}: 문자열을 입력하세요`,
      };

    const result = validateCustomItem(item);
    if (!result.isValid) {
      return {
        isValid: false,
        sanitized: null,
        error: `항목 ${String(i + 1)}: ${result.error ?? '유효하지 않은 항목'}`,
      };
    }

    if (result.sanitized) {
      sanitized.push(result.sanitized);
    }
  }

  // Check for duplicates
  const uniqueItems = new Set(sanitized);
  if (uniqueItems.size < sanitized.length) {
    return {
      isValid: false,
      sanitized: null,
      error: '중복된 항목이 있습니다',
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates JSON string for import
 *
 * @param jsonString - JSON string to validate
 * @returns Validation result with parsed object
 *
 * @example
 * ```ts
 * const result = validateJSONInput('{"key": "value"}');
 * if (result.isValid) {
 *   console.log(result.sanitized); // { key: "value" }
 * }
 * ```
 */
export function validateJSONInput(jsonString: string): ValidationResult<unknown> {
  if (jsonString.trim() === '') {
    return { isValid: false, sanitized: null, error: 'JSON 데이터를 입력해주세요' };
  }

  try {
    const parsed: unknown = JSON.parse(jsonString);
    return { isValid: true, sanitized: parsed };
  } catch {
    return {
      isValid: false,
      sanitized: null,
      error: '유효하지 않은 JSON 형식입니다',
    };
  }
}
