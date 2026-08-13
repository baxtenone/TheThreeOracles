import { nextLightningDelay, shuffleOracles } from './experience';

it('can create all six Oracle permutations deterministically', () => {
  const permutations = new Set<string>();
  for (const first of [0, .34, .67]) {
    for (const second of [0, .51]) {
      const values = [first, second];
      permutations.add(shuffleOracles(() => values.shift() ?? 0).join(','));
    }
  }
  expect(permutations).toHaveLength(6);
});

it('keeps lightning intervals within the irregular 8–25 second window', () => {
  expect(nextLightningDelay(() => 0)).toBe(8_000);
  expect(nextLightningDelay(() => .5)).toBeGreaterThan(16_000);
  expect(nextLightningDelay(() => .999999)).toBeLessThanOrEqual(25_000);
});
