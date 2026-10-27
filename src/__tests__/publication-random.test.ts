import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSecureRandomInt, selectWinners } from '@/utils/random';
afterEach(() => vi.restoreAllMocks());
describe('RNG input and rejection boundaries', () => {
  it.each([NaN, 0.5, 1.5, -1, 0, Infinity, 0x100000001])('rejects invalid raw max %s', (max) => {
    expect(() => getSecureRandomInt(max)).toThrow();
  });
  it('rejects upper-tail values instead of using modulo on them', () => {
    const values = [0xffffffff, 5];
    const random = vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      const value = values.shift();
      if (value === undefined) throw new Error('Missing test random value');
      (array as Uint32Array)[0] = value;
      return array;
    });
    expect(getSecureRandomInt(10)).toBe(5);
    expect(random).toHaveBeenCalledTimes(2);
  });
  it('supports the 2^32 integer upper bound', () => {
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      (array as Uint32Array)[0] = 0xffffffff;
      return array;
    });
    expect(getSecureRandomInt(0x100000000)).toBe(0xffffffff);
  });
  it('rejects excessive allocation bounds', () => {
    expect(() =>
      selectWinners({ totalNumbers: 10001, winnerCount: 1, allowDuplicates: false })
    ).toThrow();
  });
});
