import { type CSSProperties, useEffect, useState } from 'react';
import { nextLightningDelay } from '../lib/experience';

type Strike = { id: number; x: number; intensity: number; forked: boolean };

export function LightningLayer({ random = Math.random }: { random?: () => number }) {
  const [strike, setStrike] = useState<Strike | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return;
    let active = true;
    let sequenceTimer = 0;
    let clearTimer = 0;
    let id = 0;

    const schedule = (delay: number) => {
      sequenceTimer = window.setTimeout(() => {
        if (!active) return;
        id += 1;
        setStrike({ id, x: 16 + random() * 68, intensity: .65 + random() * .35, forked: random() > .48 });
        clearTimer = window.setTimeout(() => setStrike(null), 1050);
        schedule(nextLightningDelay(random));
      }, delay);
    };

    schedule(1400);
    return () => {
      active = false;
      window.clearTimeout(sequenceTimer);
      window.clearTimeout(clearTimer);
    };
  }, [random]);

  return <div className={`lightning-layer ${strike ? 'lightning-layer--active' : ''}`} aria-hidden="true">
    {strike && <div key={strike.id} className="lightning-strike" style={{ '--strike-x': `${strike.x}%`, '--strike-intensity': strike.intensity } as CSSProperties}>
      <span className="lightning-strike__glow" />
      <svg className="lightning-strike__bolt" viewBox="0 0 120 420" preserveAspectRatio="none">
        <path d="M73 0 52 82 69 116 40 183 53 219 25 296 43 279 34 356 67 266 52 244 82 165 64 129 89 61Z" />
        {strike.forked && <path className="lightning-strike__fork" d="m51 183-28 38 18-5-29 55 43-52" />}
      </svg>
    </div>}
  </div>;
}
