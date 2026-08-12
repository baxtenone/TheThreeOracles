import { antiConflictGuidance, oracleProfiles, sharedGroupProfile } from './oracleProfiles';

it('contains one maintainable profile for all three people', () => {
  expect(oracleProfiles.map((profile) => profile.name)).toEqual(['Bruce', 'Kevin', 'Travis']);
  expect(oracleProfiles.every((profile) => profile.facts.length > 2 && profile.reasoningStyle.length > 2)).toBe(true);
  expect(sharedGroupProfile).toContain('Brasada Ranch');
  expect(antiConflictGuidance).toMatch(/allowed to agree/i);
});
