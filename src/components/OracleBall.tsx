import type { AnswerResult } from '../../shared/contracts';

type Response = AnswerResult['responses'][number];

const accents = { Bruce: 'cyan', Kevin: 'gold', Travis: 'blue' } as const;

export function OracleBall({ name, response, loading }: { name: Response['person']; response?: Response; loading: boolean }) {
  return (
    <article className={`oracle oracle--${accents[name]} ${loading ? 'oracle--thinking' : ''}`} aria-label={`${name} Oracle`}>
      <div className="oracle__shell" aria-hidden="true">
        <div className="oracle__shine" />
        <div className="oracle__window">
          {loading ? <span className="oracle__mist" /> : response ? <span className="oracle__verdict">{response.verdict}</span> : <span className="oracle__sigil">◇</span>}
        </div>
      </div>
      <div className="oracle__content">
        <h2>{name}</h2>
        {response && (
          <div className="oracle__answer" aria-live="polite">
            <strong>{response.verdict}</strong>
            <p>{response.explanation}</p>
            {response.expandedReasoning && <details><summary>Why?</summary><p>{response.expandedReasoning}</p></details>}
          </div>
        )}
      </div>
    </article>
  );
}
