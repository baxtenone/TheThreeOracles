import { render } from '@testing-library/react';
import { LightningLayer } from './LightningLayer';

it('keeps animated strikes disabled when reduced motion is requested', () => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  const { container, unmount } = render(<LightningLayer random={() => .5}/>);
  vi.advanceTimersByTime(30_000);
  expect(container.querySelector('.lightning-layer')).toBeInTheDocument();
  expect(container.querySelector('.lightning-strike')).not.toBeInTheDocument();
  unmount();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
