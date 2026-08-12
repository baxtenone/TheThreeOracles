import { forwardRef } from 'react';
import type { AnswerResult } from '../../shared/contracts';

type Response = AnswerResult['responses'][number];
const accents = { Bruce: 'cyan', Kevin: 'gold', Travis: 'blue' } as const;

export function OracleBall({ name, response, loading, selected, onSelect, buttonRef }: {
  name: Response['person'];
  response?: Response;
  loading: boolean;
  selected: boolean;
  onSelect: () => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <article data-oracle-interactive className={`oracle oracle--${accents[name]} ${loading ? 'oracle--thinking' : ''} ${response?.mode === 'dodge' ? 'oracle--dodge' : ''}`}>
      <button ref={buttonRef} className="oracle__button" onClick={onSelect} disabled={!response || loading} aria-label={response ? `Open ${name}'s Oracle answer` : `${name} Oracle`} aria-expanded={response ? selected : undefined} aria-controls={response ? 'oracle-answer-cloud' : undefined}>
        <span className="oracle__shell" aria-hidden="true">
          <span className="oracle__shine" />
          <span className="oracle__window">
            {loading ? <span className="oracle__mist" /> : response ? <span className="oracle__label">{response.ballLabel}</span> : <span className="oracle__sigil">◇</span>}
          </span>
        </span>
        <span className="oracle__name">{name}</span>
        {response && <span className="oracle__hint">{selected ? 'Close' : 'Tap to reveal'}</span>}
      </button>
    </article>
  );
}

export const MysticBubble = forwardRef<HTMLButtonElement, { response: Response; onClose: () => void }>(function MysticBubble({ response, onClose }, closeRef) {
  return (
    <section id="oracle-answer-cloud" className={`mystic-bubble mystic-bubble--${accents[response.person]} ${response.mode === 'dodge' ? 'mystic-bubble--dodge' : ''}`} data-oracle-bubble role="dialog" aria-modal="false" aria-labelledby="oracle-answer-title">
      <button ref={closeRef} className="mystic-bubble__close" onClick={onClose} aria-label="Close Oracle answer">×</button>
      <p id="oracle-answer-title" className="mystic-bubble__person">{response.person} <span>· {response.mode === 'dodge' ? 'THE ORACLE SLIPS AWAY' : response.ballLabel}</span></p>
      <p className="mystic-bubble__answer">{response.fullAnswer}</p>
      {response.expandedReasoning && <details><summary>Why?</summary><p>{response.expandedReasoning}</p></details>}
    </section>
  );
});
