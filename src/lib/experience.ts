import { PEOPLE } from '../../shared/contracts';

export type OraclePerson = (typeof PEOPLE)[number];

export function shuffleOracles(random: () => number = Math.random): OraclePerson[] {
  const order = [...PEOPLE];
  for (let index = order.length - 1; index > 0; index -= 1) {
    const value = Math.max(0, Math.min(.999999, random()));
    const swapIndex = Math.floor(value * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  return order;
}

export function nextLightningDelay(random: () => number = Math.random): number {
  return 8_000 + Math.floor(Math.max(0, Math.min(.999999, random())) * 17_001);
}
