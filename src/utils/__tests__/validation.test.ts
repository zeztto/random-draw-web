import { describe, it, expect } from 'vitest';
import {
  validateNumberInput,
  sanitizeCustomItem,
  validateCustomItem,
  validateCustomItemsList,
  validateJSONInput,
} from '../validation';

describe('validateNumberInput', () => {
  describe('valid inputs', () => {
    it('should accept valid numbers within range', () => {
      const result = validateNumberInput('42', 1, 100);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it('should accept boundary values', () => {
      const min = validateNumberInput('1', 1, 100);
      expect(min.isValid).toBe(true);
      expect(min.sanitized).toBe(1);

      const max = validateNumberInput('100', 1, 100);
      expect(max.isValid).toBe(true);
      expect(max.sanitized).toBe(100);
    });

    it('should handle leading zeros', () => {
      const result = validateNumberInput('007', 1, 100);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(7);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty string', () => {
      const result = validateNumberInput('', 1, 100);
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBeNull();
      expect(result.error).toContain('입력');
    });

    it('should reject whitespace', () => {
      const result = validateNumberInput('   ', 1, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('입력');
    });

    it('should reject non-numeric characters', () => {
      const cases = ['abc', '12a', 'a12', '1.2', '-5', '1e5', '1+2'];

      cases.forEach((value) => {
        const result = validateNumberInput(value, 1, 100);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('숫자');
      });
    });

    it('should reject decimal numbers', () => {
      const result = validateNumberInput('3.14', 1, 100);
      expect(result.isValid).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = validateNumberInput('-5', 1, 100);
      expect(result.isValid).toBe(false);
    });

    it('should reject out-of-range values', () => {
      const tooLow = validateNumberInput('0', 1, 100);
      expect(tooLow.isValid).toBe(false);
      expect(tooLow.error).toContain('범위');

      const tooHigh = validateNumberInput('101', 1, 100);
      expect(tooHigh.isValid).toBe(false);
      expect(tooHigh.error).toContain('범위');
    });
  });

  describe('security', () => {
    it('should reject XSS attempts in number field', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
      ];

      xssAttempts.forEach((attempt) => {
        const result = validateNumberInput(attempt, 1, 100);
        expect(result.isValid).toBe(false);
      });
    });
  });
});

describe('sanitizeCustomItem', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeCustomItem(input);

    expect(output).not.toContain('<script>');
    expect(output).not.toContain('</script>');
    expect(output).toContain('&lt;');
    expect(output).toContain('&gt;');
    expect(output).toContain('&quot;');
  });

  it('should escape all dangerous characters', () => {
    const dangerous = '&<>"\'/';
    const sanitized = sanitizeCustomItem(dangerous);

    expect(sanitized).toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;');
  });

  it('should trim whitespace', () => {
    const input = '  사과  ';
    const output = sanitizeCustomItem(input);
    expect(output).toBe('사과');
  });

  it('should limit length', () => {
    const longText = 'a'.repeat(200);
    const output = sanitizeCustomItem(longText, 50);
    expect(output.length).toBe(50);
  });

  it('should preserve Korean characters', () => {
    const korean = '사과 바나나 포도';
    const output = sanitizeCustomItem(korean);
    expect(output).toBe(korean);
  });

  it('should preserve spaces between words', () => {
    const input = '사과 바나나';
    const output = sanitizeCustomItem(input);
    expect(output).toBe('사과 바나나');
  });
});

describe('validateCustomItem', () => {
  describe('valid inputs', () => {
    it('should accept valid text', () => {
      const result = validateCustomItem('사과');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('사과');
    });

    it('should accept text with spaces', () => {
      const result = validateCustomItem('빨간 사과');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('빨간 사과');
    });

    it('should trim and sanitize', () => {
      const result = validateCustomItem('  사과  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('사과');
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty string', () => {
      const result = validateCustomItem('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('입력');
    });

    it('should reject whitespace only', () => {
      const result = validateCustomItem('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('입력');
    });

    it('should reject too long text', () => {
      const longText = 'a'.repeat(101);
      const result = validateCustomItem(longText);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('최대');
    });

    it('should reject too short text when minLength set', () => {
      const result = validateCustomItem('a', 3);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('최소');
    });
  });

  describe('security - XSS prevention', () => {
    it('should reject script tags', () => {
      const xss = '<script>alert("xss")</script>';
      const result = validateCustomItem(xss);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should reject javascript: protocol', () => {
      const xss = 'javascript:alert(1)';
      const result = validateCustomItem(xss);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should reject event handlers', () => {
      const xssAttempts = ['<img onerror=alert(1)>', 'onclick=alert(1)', 'onload=bad()'];

      xssAttempts.forEach((attempt) => {
        const result = validateCustomItem(attempt);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('허용되지 않는');
      });
    });

    it('should reject iframe tags', () => {
      const xss = '<iframe src="evil.com"></iframe>';
      const result = validateCustomItem(xss);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않는');
    });

    it('should reject object and embed tags', () => {
      const attempts = ['<object data="evil"></object>', '<embed src="evil">'];

      attempts.forEach((attempt) => {
        const result = validateCustomItem(attempt);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('허용되지 않는');
      });
    });

    it('should be case-insensitive for dangerous patterns', () => {
      const variants = ['<SCRIPT>', '<Script>', '<sCrIpT>', 'JAVASCRIPT:'];

      variants.forEach((variant) => {
        const result = validateCustomItem(variant);
        expect(result.isValid).toBe(false);
      });
    });
  });
});

describe('validateCustomItemsList', () => {
  describe('valid lists', () => {
    it('should accept valid list of items', () => {
      const items = ['사과', '바나나', '포도'];
      const result = validateCustomItemsList(items);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(['사과', '바나나', '포도']);
    });

    it('should trim and sanitize all items', () => {
      const items = ['  사과  ', '바나나', '  포도'];
      const result = validateCustomItemsList(items);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual(['사과', '바나나', '포도']);
    });

    it('should accept minimum number of items', () => {
      const items = ['사과', '바나나'];
      const result = validateCustomItemsList(items, 2);

      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid lists', () => {
    it('should reject non-array input', () => {
      const result = validateCustomItemsList('not an array');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('유효하지 않은');
    });

    it('should reject too few items', () => {
      const items = ['사과'];
      const result = validateCustomItemsList(items, 2);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('최소');
    });

    it('should reject too many items', () => {
      const items = Array(101).fill('item');
      const result = validateCustomItemsList(items, 2, 100);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('최대');
    });

    it('should reject duplicate items', () => {
      const items = ['사과', '바나나', '사과'];
      const result = validateCustomItemsList(items);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('중복');
    });

    it('should reject if any item is invalid', () => {
      const items = ['사과', '<script>alert("xss")</script>', '포도'];
      const result = validateCustomItemsList(items);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('항목 2');
    });

    it('should reject empty items', () => {
      const items = ['사과', '   ', '포도'];
      const result = validateCustomItemsList(items);

      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateJSONInput', () => {
  describe('valid JSON', () => {
    it('should accept valid JSON object', () => {
      const json = '{"key": "value"}';
      const result = validateJSONInput(json);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({ key: 'value' });
    });

    it('should accept valid JSON array', () => {
      const json = '[1, 2, 3]';
      const result = validateJSONInput(json);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual([1, 2, 3]);
    });

    it('should accept complex nested JSON', () => {
      const json = '{"items": [{"id": 1, "name": "사과"}]}';
      const result = validateJSONInput(json);

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toEqual({
        items: [{ id: 1, name: '사과' }],
      });
    });
  });

  describe('invalid JSON', () => {
    it('should reject empty string', () => {
      const result = validateJSONInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('입력');
    });

    it('should reject malformed JSON', () => {
      const invalid = [
        '{key: value}', // No quotes
        '{"key": value}', // Unquoted value
        '{key: "value"}', // Unquoted key
        '{"key": "value",}', // Trailing comma
        "{'key': 'value'}", // Single quotes
      ];

      invalid.forEach((json) => {
        const result = validateJSONInput(json);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('유효하지 않은');
      });
    });

    it('should reject incomplete JSON', () => {
      const incomplete = ['{"key":', '{"key": "value"', '[1, 2'];

      incomplete.forEach((json) => {
        const result = validateJSONInput(json);
        expect(result.isValid).toBe(false);
      });
    });
  });
});
