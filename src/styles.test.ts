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

it('uses a compact top and two-below Oracle triangle on phone and desktop', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  const phone = css.slice(css.indexOf('@media (max-width: 700px)'), css.indexOf('@media (prefers-reduced-motion: reduce)'));
  expect(css).toMatch(/\.oracle-triangle\s*\{[^}]*grid-template-columns:\s*1fr\s+1fr/);
  expect(css).toMatch(/\.oracle-triangle__slot--top\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  expect(phone).toMatch(/\.oracle-triangle__slot--top \.oracle__shell\s*\{[^}]*width:\s*158px/);
  expect(phone).toMatch(/\.oracle-triangle__slot--left \.oracle__shell[^}]*width:\s*148px/);
});

it('renders real lightning behind signed-in content and disables it for reduced motion', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  expect(css).toMatch(/\.lightning-layer\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*-2/);
  expect(css).toContain('@keyframes lightningSequence');
  expect(reduced).toMatch(/\.lightning-layer\s*\{[^}]*visibility:\s*hidden/);
});

it('enlarges the answer aperture and geometrically centers short and wrapped labels', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  expect(css).toMatch(/\.oracle__window\s*\{[^}]*inset:\s*22%[^}]*display:\s*grid[^}]*place-items:\s*center/);
  expect(css).toMatch(/\.oracle__label\s*\{[^}]*display:\s*grid[^}]*place-items:\s*center[^}]*text-align:\s*center[^}]*text-wrap:\s*balance/);
});

it('keeps the cloud viewport-fixed and prevents phone page overflow', () => {
  const css = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
  expect(css).toMatch(/\.answer-cloud-layer\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/);
  expect(css).toMatch(/\.app-shell\s*\{[^}]*overflow-x:\s*clip/);
});
