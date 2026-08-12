import type { AnswerResult } from '../../shared/contracts';

type Response = AnswerResult['responses'][number];
const accents = { Bruce: 'cyan', Kevin: 'gold', Travis: 'blue' } as const;

export function OracleBall({ name, response, loading, selected, onSelect }: {
  name: Response['person'];
  response?: Response;
  loading: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article data-oracle-interactive className={`oracle oracle--${accents[name]} ${loading ? 'oracle--thinking' : ''} ${response?.mode === 'dodge' ? 'oracle--dodge' : ''}`}>
      <button className="oracle__button" onClick={onSelect} disabled={!response || loading} aria-label={response ? `Open ${name}'s Oracle answer` : `${name} Oracle`} aria-expanded={response ? selected : undefined}>
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

export function MysticBubble({ response, onClose }: { response: Response; onClose: () => void }) {
  return (
    <section className={`mystic-bubble mystic-bubble--${accents[response.person]} ${response.mode === 'dodge' ? 'mystic-bubble--dodge' : ''}`} data-oracle-bubble role="region" aria-label={`${response.person}'s answer`}>
      <button className="mystic-bubble__close" onClick={onClose} aria-label="Close Oracle answer">×</button>
      <p className="mystic-bubble__person">{response.person} <span>· {response.mode === 'dodge' ? 'THE ORACLE SLIPS AWAY' : response.ballLabel}</span></p>
      <p className="mystic-bubble__answer">{response.fullAnswer}</p>
      {response.expandedReasoning && <details><summary>Why?</summary><p>{response.expandedReasoning}</p></details>}
    </section>
  );
}
