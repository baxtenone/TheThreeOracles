import { readFileSync } from 'node:fs';

it('keeps functionality independent of motion', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  expect(reduced).toContain('animation-duration');
  expect(reduced).not.toContain('display: none');
});
