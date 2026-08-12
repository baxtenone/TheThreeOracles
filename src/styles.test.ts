import { readFileSync } from 'node:fs';

it('keeps functionality independent of motion', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  expect(reduced).toContain('animation-duration');
  expect(reduced).not.toContain('display: none');
});

it('provides scenic signed-in and entry backgrounds without document overflow styles', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  expect(css).toContain("central-oregon-storm.webp");
  expect(css).toContain("central-oregon-dusk.webp");
  expect(css).toMatch(/\.app-shell[^}]*overflow-x:\s*clip/);
});

it('makes narrow categories intentionally scrollable with a continuation cue', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  expect(css).toMatch(/\.category-strip[^}]*overflow-x:\s*auto/);
  expect(css).toContain('mask-image: linear-gradient');
  expect(css).toContain('min-height: 44px');
});
