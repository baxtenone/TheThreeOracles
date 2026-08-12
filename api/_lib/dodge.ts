import { PEOPLE, type AnswerResult } from '../../shared/contracts.js';

export const DODGE_PROBABILITY = 0.25;

export type DodgePlan =
  | { mode: 'all-answer'; person: null }
  | { mode: 'one-dodge'; person: (typeof PEOPLE)[number] };

export function chooseDodgePlan(random: () => number = Math.random): DodgePlan {
  if (random() >= DODGE_PROBABILITY) return { mode: 'all-answer', person: null };
  const index = Math.min(PEOPLE.length - 1, Math.floor(random() * PEOPLE.length));
  return { mode: 'one-dodge', person: PEOPLE[index] };
}

export function assertDodgePlan(result: AnswerResult, plan: DodgePlan): AnswerResult {
  const dodges = result.responses.filter((response) => response.mode === 'dodge');
  if (plan.mode === 'all-answer' && dodges.length !== 0) throw new Error('Model violated the all-answer plan');
  if (plan.mode === 'one-dodge' && (dodges.length !== 1 || dodges[0].person !== plan.person)) {
    throw new Error('Model violated the one-dodge plan');
  }
  return result;
}
