import { assertDodgePlan, chooseDodgePlan, DODGE_PROBABILITY } from './dodge';
import type { AnswerResult } from '../../shared/contracts';

const allAnswers: AnswerResult = {
  question: 'Could it work?',
  responses: [
    { person: 'Bruce', mode: 'answer', ballLabel: 'Worth trying.', fullAnswer: 'Prototype it.', expandedReasoning: null },
    { person: 'Kevin', mode: 'answer', ballLabel: 'Needs proof.', fullAnswer: 'Test the evidence.', expandedReasoning: null },
    { person: 'Travis', mode: 'answer', ballLabel: 'Check incentives.', fullAnswer: 'The constraints matter.', expandedReasoning: null }
  ],
  group: { alignment: 'mostly-agreed', summary: 'They broadly agree.', mainDisagreement: null, conversationStarter: 'What test comes first?', dodgePerson: null }
};

describe('controlled playful dodges', () => {
  it('uses a named 25% probability and produces zero dodges on the all-answer path', () => {
    expect(DODGE_PROBABILITY).toBe(.25);
    expect(chooseDodgePlan(() => .75)).toEqual({ mode: 'all-answer', person: null });
    expect(assertDodgePlan(allAnswers, { mode: 'all-answer', person: null }).responses.filter((r) => r.mode === 'dodge')).toHaveLength(0);
  });
  it.each([['Bruce', .0], ['Kevin', .34], ['Travis', .99]] as const)('can select %s as the only dodge', (person, selection) => {
    const values = [0, selection];
    const plan = chooseDodgePlan(() => values.shift() ?? 0);
    expect(plan).toEqual({ mode: 'one-dodge', person });
    const dodgeResult: AnswerResult = {
      ...allAnswers,
      responses: allAnswers.responses.map((response) => response.person === person ? { ...response, mode: 'dodge' as const, ballLabel: 'Still thinking.', fullAnswer: `${person} slips away.` } : response),
      group: { ...allAnswers.group, dodgePerson: person, summary: `Two useful answers; ${person} sat this one out.` }
    };
    expect(assertDodgePlan(dodgeResult, plan).responses.filter((r) => r.mode === 'dodge')).toHaveLength(1);
  });
  it('rejects a model result that dodges more than the selected plan', () => {
    expect(() => assertDodgePlan(allAnswers, { mode: 'one-dodge', person: 'Bruce' })).toThrow(/violated/);
  });
});
