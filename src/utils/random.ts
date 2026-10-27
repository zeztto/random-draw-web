/** Web Crypto Uint32 selection. Rejection sampling avoids modulo reduction bias.
 * This local implementation is not an independent fairness audit. */
type RandomSource = Pick<Crypto, 'getRandomValues'>;
function isRandomSource(source: unknown): source is RandomSource {
  return (
    typeof source === 'object' &&
    source !== null &&
    'getRandomValues' in source &&
    typeof source.getRandomValues === 'function'
  );
}

export function getSecureRandomInt(max: number): number {
  if (!Number.isSafeInteger(max) || max <= 0 || max > 0x100000000) {
    throw new Error(`Invalid max value: ${String(max)}. Must be an integer in 1..2^32`);
  }
  const source: unknown = Reflect.get(globalThis, 'crypto');
  if (!isRandomSource(source)) throw new Error('Web Crypto API is not available');
  const range = Math.floor(0x100000000 / max) * max;
  const data = new Uint32Array(1);
  let randomValue: number;
  do {
    source.getRandomValues(data);
    const value = data[0];
    if (value === undefined) throw new Error('Random source returned no value');
    randomValue = value;
  } while (randomValue >= range);
  return randomValue % max;
}

export interface SelectWinnersOptions {
  totalNumbers: number;
  winnerCount: number;
  allowDuplicates: boolean;
}

function validateTotal(totalNumbers: number): void {
  if (!Number.isSafeInteger(totalNumbers) || totalNumbers < 1 || totalNumbers > 10000) {
    throw new Error(`Invalid totalNumbers: ${String(totalNumbers)}`);
  }
}

export function selectWinners({
  totalNumbers,
  winnerCount,
  allowDuplicates,
}: SelectWinnersOptions): number[] {
  validateTotal(totalNumbers);
  if (!Number.isSafeInteger(winnerCount) || winnerCount < 1 || winnerCount > 10000) {
    throw new Error(`Invalid winnerCount: ${String(winnerCount)}`);
  }
  if (typeof allowDuplicates !== 'boolean') throw new Error('Invalid allowDuplicates');
  if (!allowDuplicates && winnerCount > totalNumbers) {
    throw new Error(
      `Cannot select ${String(winnerCount)} unique winners from ${String(totalNumbers)} numbers`
    );
  }
  const available = Array.from({ length: totalNumbers }, (_, index) => index + 1);
  const winners: number[] = [];
  for (let index = 0; index < winnerCount; index++) {
    if (allowDuplicates) winners.push(getSecureRandomInt(totalNumbers) + 1);
    else {
      const selectedIndex = getSecureRandomInt(available.length);
      const selected = available[selectedIndex];
      const last = available.pop();
      if (selected === undefined || last === undefined) throw new Error('No available numbers');
      if (selectedIndex < available.length) available[selectedIndex] = last;
      winners.push(selected);
    }
  }
  return winners;
}

export function generateSecureId(length = 16): string {
  if (!Number.isSafeInteger(length) || length <= 0 || length > 4096)
    throw new Error('Invalid ID length');
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let index = 0; index < length; index++)
    result += chars.charAt(getSecureRandomInt(chars.length));
  return result;
}

/** Pick from the remaining pool without a finite retry failure. */
export function selectNextWinner(
  totalNumbers: number,
  previous: number[],
  allowDuplicates: boolean
): number {
  validateTotal(totalNumbers);
  if (
    typeof allowDuplicates !== 'boolean' ||
    !Array.isArray(previous) ||
    previous.some((value) => !Number.isSafeInteger(value) || value < 1 || value > totalNumbers)
  ) {
    throw new Error('Invalid previous winners');
  }
  const available = Array.from({ length: totalNumbers }, (_, index) => index + 1).filter(
    (value) => allowDuplicates || !previous.includes(value)
  );
  if (available.length === 0) throw new Error('No available numbers');
  const selected = available[getSecureRandomInt(available.length)];
  if (selected === undefined) throw new Error('No available numbers');
  return selected;
}
