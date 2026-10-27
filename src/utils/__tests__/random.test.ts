import { describe, it, expect } from 'vitest';
import { getSecureRandomInt, selectWinners, generateSecureId } from '../random';

describe('getSecureRandomInt', () => {
  it('should generate numbers within range [0, max)', () => {
    const max = 10;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const result = getSecureRandomInt(max);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(max);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it('should have uniform distribution (Chi-square test)', () => {
    const max = 10;
    const iterations = 10000;
    const expected = iterations / max;
    const buckets: number[] = Array.from({ length: max }, () => 0);

    // Generate random numbers and count occurrences
    for (let i = 0; i < iterations; i++) {
      const result = getSecureRandomInt(max);
      const current = buckets[result];
      if (current === undefined) throw new Error('Invalid test bucket');
      buckets[result] = current + 1;
    }

    // Chi-square test: sum of (observed - expected)^2 / expected
    // For 10 buckets at 95% confidence, chi-square critical value is ~16.92
    const chiSquare = buckets.reduce((sum, observed) => {
      return sum + Math.pow(observed - expected, 2) / expected;
    }, 0);

    // Accept if chi-square < 20 (lenient for small sample size)
    expect(chiSquare).toBeLessThan(20);

    // Each bucket should have at least 5% of expected count
    buckets.forEach((count) => {
      expect(count).toBeGreaterThan(expected * 0.5);
      expect(count).toBeLessThan(expected * 1.5);
    });
  });

  it('should handle edge cases', () => {
    expect(getSecureRandomInt(1)).toBe(0);
    expect(getSecureRandomInt(2)).toBeGreaterThanOrEqual(0);
    expect(getSecureRandomInt(2)).toBeLessThan(2);
  });

  it('should throw error for invalid max values', () => {
    expect(() => getSecureRandomInt(0)).toThrow('Invalid max value');
    expect(() => getSecureRandomInt(-5)).toThrow('Invalid max value');
    expect(() => getSecureRandomInt(0x100000001)).toThrow('Invalid max value');
  });

  it('should generate different values (not deterministic)', () => {
    const results = new Set<number>();
    const max = 1000;

    for (let i = 0; i < 100; i++) {
      results.add(getSecureRandomInt(max));
    }

    // Should have at least 80 unique values out of 100 attempts
    expect(results.size).toBeGreaterThan(80);
  });
});

describe('selectWinners', () => {
  describe('with duplicates allowed', () => {
    it('should select correct number of winners', () => {
      const winners = selectWinners({
        totalNumbers: 10,
        winnerCount: 5,
        allowDuplicates: true,
      });

      expect(winners).toHaveLength(5);
    });

    it('should allow duplicate numbers', () => {
      // With 3 numbers and 100 selections, duplicates should occur
      const winners = selectWinners({
        totalNumbers: 3,
        winnerCount: 100,
        allowDuplicates: true,
      });

      const unique = new Set(winners);
      expect(unique.size).toBeLessThan(winners.length);
    });

    it('should generate numbers in range [1, totalNumbers]', () => {
      const totalNumbers = 45;
      const winners = selectWinners({
        totalNumbers,
        winnerCount: 100,
        allowDuplicates: true,
      });

      winners.forEach((winner) => {
        expect(winner).toBeGreaterThanOrEqual(1);
        expect(winner).toBeLessThanOrEqual(totalNumbers);
      });
    });

    it('should allow winnerCount > totalNumbers', () => {
      const winners = selectWinners({
        totalNumbers: 5,
        winnerCount: 10,
        allowDuplicates: true,
      });

      expect(winners).toHaveLength(10);
    });
  });

  describe('without duplicates', () => {
    it('should select correct number of unique winners', () => {
      const winners = selectWinners({
        totalNumbers: 10,
        winnerCount: 5,
        allowDuplicates: false,
      });

      expect(winners).toHaveLength(5);
      const unique = new Set(winners);
      expect(unique.size).toBe(5);
    });

    it('should not allow duplicate numbers', () => {
      const winners = selectWinners({
        totalNumbers: 45,
        winnerCount: 10,
        allowDuplicates: false,
      });

      const unique = new Set(winners);
      expect(unique.size).toBe(winners.length);
    });

    it('should generate numbers in range [1, totalNumbers]', () => {
      const totalNumbers = 45;
      const winners = selectWinners({
        totalNumbers,
        winnerCount: 10,
        allowDuplicates: false,
      });

      winners.forEach((winner) => {
        expect(winner).toBeGreaterThanOrEqual(1);
        expect(winner).toBeLessThanOrEqual(totalNumbers);
      });
    });

    it('should handle selecting all numbers', () => {
      const totalNumbers = 10;
      const winners = selectWinners({
        totalNumbers,
        winnerCount: totalNumbers,
        allowDuplicates: false,
      });

      expect(winners).toHaveLength(totalNumbers);
      const unique = new Set(winners);
      expect(unique.size).toBe(totalNumbers);

      // Should contain all numbers from 1 to totalNumbers
      for (let i = 1; i <= totalNumbers; i++) {
        expect(winners).toContain(i);
      }
    });

    it('should throw error if winnerCount > totalNumbers', () => {
      expect(() =>
        selectWinners({
          totalNumbers: 5,
          winnerCount: 10,
          allowDuplicates: false,
        })
      ).toThrow('Cannot select');
    });
  });

  describe('validation', () => {
    it('should throw error for invalid totalNumbers', () => {
      expect(() =>
        selectWinners({
          totalNumbers: 0,
          winnerCount: 1,
          allowDuplicates: false,
        })
      ).toThrow('Invalid totalNumbers');

      expect(() =>
        selectWinners({
          totalNumbers: -5,
          winnerCount: 1,
          allowDuplicates: false,
        })
      ).toThrow('Invalid totalNumbers');

      expect(() =>
        selectWinners({
          totalNumbers: 1.5,
          winnerCount: 1,
          allowDuplicates: false,
        })
      ).toThrow('Invalid totalNumbers');
    });

    it('should throw error for invalid winnerCount', () => {
      expect(() =>
        selectWinners({
          totalNumbers: 10,
          winnerCount: 0,
          allowDuplicates: false,
        })
      ).toThrow('Invalid winnerCount');

      expect(() =>
        selectWinners({
          totalNumbers: 10,
          winnerCount: -3,
          allowDuplicates: false,
        })
      ).toThrow('Invalid winnerCount');

      expect(() =>
        selectWinners({
          totalNumbers: 10,
          winnerCount: 2.5,
          allowDuplicates: false,
        })
      ).toThrow('Invalid winnerCount');
    });
  });

  describe('fairness and distribution', () => {
    it('should have fairly uniform distribution', () => {
      const totalNumbers = 10;
      const iterations = 1000;
      const counts = new Map<number, number>();

      // Run multiple lotteries
      for (let i = 0; i < iterations; i++) {
        const winners = selectWinners({
          totalNumbers,
          winnerCount: 1,
          allowDuplicates: false,
        });

        const winner = winners[0];
        if (winner === undefined) throw new Error('Missing test result');
        counts.set(winner, (counts.get(winner) ?? 0) + 1);
      }

      // Each number should appear roughly iterations/totalNumbers times
      const expected = iterations / totalNumbers;

      counts.forEach((count) => {
        // Allow 40% deviation
        expect(count).toBeGreaterThan(expected * 0.6);
        expect(count).toBeLessThan(expected * 1.4);
      });
    });
  });
});

describe('generateSecureId', () => {
  it('should generate ID of correct length', () => {
    expect(generateSecureId(8)).toHaveLength(8);
    expect(generateSecureId(16)).toHaveLength(16);
    expect(generateSecureId(32)).toHaveLength(32);
  });

  it('should generate default 16-character ID', () => {
    expect(generateSecureId()).toHaveLength(16);
  });

  it('should only contain alphanumeric characters', () => {
    const id = generateSecureId(100);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      ids.add(generateSecureId());
    }

    // All IDs should be unique
    expect(ids.size).toBe(1000);
  });

  it('should have good entropy', () => {
    const id = generateSecureId(1000);
    const charCounts = new Map<string, number>();

    // Count character frequencies
    for (const char of id) {
      charCounts.set(char, (charCounts.get(char) ?? 0) + 1);
    }

    // Each character should appear roughly evenly
    // With 36 possible characters and 1000 chars, expect ~27-28 per char
    charCounts.forEach((count) => {
      expect(count).toBeGreaterThan(10);
      expect(count).toBeLessThan(50);
    });
  });
});
