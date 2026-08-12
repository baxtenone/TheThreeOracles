import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, MAX_QUESTION_LENGTH, PEOPLE, recentHistoryForApi, type AnswerResult, type Category, type DiscussionResult } from '../shared/contracts';
import { MysticBubble, OracleBall } from './components/OracleBall';
import { ApiError, askOracles, generateQuestion, verifyAccess } from './lib/api';
import { accessStorage, categoryStorage, questionHistory } from './lib/storage';

type View = 'ask' | 'pose' | 'settings';

export default function App() {
  const [accessCode, setAccessCode] = useState(() => accessStorage.get());
  const [authenticated, setAuthenticated] = useState(() => Boolean(accessStorage.get()));
  const [view, setView] = useState<View>('ask');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<AnswerResult | null>(null);
  const [generated, setGenerated] = useState<DiscussionResult | null>(null);
  const [category, setCategory] = useState<Category>(() => categoryStorage.get());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<(typeof PEOPLE)[number] | null>(null);
  const inFlight = useRef(false);
  const answerByPerson = useMemo(() => new Map(answers?.responses.map((item) => [item.person, item])), [answers]);
  const selectedResponse = selectedPerson ? answerByPerson.get(selectedPerson) : undefined;

  useEffect(() => {
    if (!selectedPerson) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-oracle-interactive], [data-oracle-bubble]')) setSelectedPerson(null);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [selectedPerson]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessCode.trim() || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await verifyAccess(accessCode.trim()); accessStorage.set(accessCode.trim()); setAuthenticated(true); }
    catch (cause) { setError(messageFor(cause)); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function submitQuestion(event?: FormEvent) {
    event?.preventDefault();
    const clean = question.trim();
    if (!clean) return setError('Give the Oracles a question first.');
    if (clean.length > MAX_QUESTION_LENGTH) return setError(`Keep the question under ${MAX_QUESTION_LENGTH} characters.`);
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setAnswers(null); setSelectedPerson(null);
    try { setAnswers(await askOracles(clean, accessCode)); } catch (cause) { handleApiError(cause); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function poseQuestion() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const result = await generateQuestion(category, recentHistoryForApi(questionHistory.get()), accessCode);
      questionHistory.add(result.question); setGenerated(result);
    } catch (cause) { handleApiError(cause); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function signOut() { accessStorage.clear(); setAuthenticated(false); setAccessCode(''); setAnswers(null); setGenerated(null); setSelectedPerson(null); setError(''); }
  function handleApiError(cause: unknown) { if (cause instanceof ApiError && cause.status === 401) signOut(); setError(messageFor(cause)); }
  function askGenerated() {
    if (!generated) return;
    setQuestion(generated.question); setAnswers(null); setView('ask'); setError('');
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>('#oracle-question')?.focus(), 0);
  }

  if (!authenticated) return <AccessGate code={accessCode} setCode={setAccessCode} submit={authenticate} busy={busy} error={error} />;

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView('ask')} aria-label="The Three Oracles home"><span className="brand__mark">◈</span><span>THE THREE ORACLES</span></button>
      <button className="icon-button" onClick={() => setView('settings')} aria-label="Open Settings">•••</button>
    </header>
    <main>
      <section className="hero"><p className="eyebrow">BRUCE <span>•</span> KEVIN <span>•</span> TRAVIS</p><h1>Three perspectives.<br/><em>One question.</em></h1></section>
      <nav className="mode-switch" aria-label="Choose an Oracle mode">
        <button className={view === 'ask' ? 'active' : ''} onClick={() => { setView('ask'); setError(''); }}>Ask the Oracles</button>
        <button className={view === 'pose' ? 'active' : ''} onClick={() => { setView('pose'); setError(''); }}>Great Questions</button>
      </nav>

      {view === 'ask' && <>
        <form className="ask-panel" onSubmit={submitQuestion}>
          <label htmlFor="oracle-question">What do you want to know?</label>
          <textarea id="oracle-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={MAX_QUESTION_LENGTH} placeholder="Should humans colonize Mars?" rows={3} disabled={busy}/>
          <div className="ask-panel__footer">{MAX_QUESTION_LENGTH - question.length < 75 ? <span className="count" aria-live="polite">{MAX_QUESTION_LENGTH - question.length} left</span> : <span/>}<button className="primary-button" disabled={busy || !question.trim()}>{busy ? 'Consulting…' : 'Ask the Oracles'} <span aria-hidden="true">→</span></button></div>
        </form>
        <section className="oracle-stage" aria-busy={busy} aria-live="polite">
          <div className="oracle-row">{PEOPLE.map((person) => <OracleBall key={person} name={person} response={answerByPerson.get(person)} loading={busy} selected={selectedPerson === person} onSelect={() => setSelectedPerson((current) => current === person ? null : person)}/>)}</div>
          {selectedResponse && <div className={`mystic-anchor mystic-anchor--${selectedResponse.person.toLowerCase()}`}><MysticBubble response={selectedResponse} onClose={() => setSelectedPerson(null)}/></div>}
        </section>
        {answers && <GroupResult result={answers.group}/>}
      </>}

      {view === 'pose' && <section className="pose-panel">
        <div className="category-strip" aria-label="Question category">{CATEGORIES.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => { setCategory(item); categoryStorage.set(item); }}>{item}</button>)}</div>
        <div className={`posed-card ${busy ? 'posed-card--thinking' : ''}`} aria-busy={busy} aria-live="polite">
          <span className="posed-card__label">A QUESTION FOR THE TABLE</span>
          {busy ? <h2>The room is thinking…</h2> : generated ? <><h2>{generated.question}</h2>{generated.optionalContext && <p>{generated.optionalContext}</p>}</> : <h2>Let the Oracles put something interesting on the table.</h2>}
          <span className="posed-card__ornament" aria-hidden="true">◌</span>
        </div>
        <div className="pose-actions"><button className="primary-button" onClick={poseQuestion} disabled={busy}>{generated ? 'Another Question' : 'Find a Great Question'} <span>↻</span></button>{generated && <button className="secondary-button" onClick={askGenerated}>Ask the Oracles <span>→</span></button>}</div>
      </section>}

      {view === 'settings' && <Settings onClear={() => { questionHistory.clear(); setError('Question history cleared.'); }} onSignOut={signOut}/>}
      {error && <div className="notice" role="alert">{error}</div>}
    </main>
    <footer>BRASADA RANCH · V1.1</footer>
  </div>;
}

function AccessGate({ code, setCode, submit, busy, error }: { code: string; setCode: (value: string) => void; submit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean; error: string }) {
  return <main className="gate"><div className="gate__orbits" aria-hidden="true"><i/><i/><i/></div><form className="gate__card" onSubmit={submit}>
    <span className="gate__mark">◈</span><h1>The Three<br/><em>Oracles</em></h1><p>Bruce, Kevin, and Travis have the code.</p>
    <label htmlFor="access-code">Shared access code</label><input id="access-code" type="password" autoComplete="current-password" value={code} onChange={(event) => setCode(event.target.value)} autoFocus/>
    <button className="primary-button" disabled={busy || !code.trim()}>{busy ? 'Checking…' : 'Enter the Room'} <span>→</span></button>{error && <div className="notice" role="alert">{error}</div>}
  </form></main>;
}

function GroupResult({ result }: { result: AnswerResult['group'] }) {
  const labels = { unanimous: 'Unanimous', 'mostly-agreed': 'Mostly Agreed', split: 'Split Decision', 'no-consensus': 'No Clear Consensus' };
  return <section className="group-result"><p className="eyebrow">THE TABLE SAYS</p><h2>{result.dodgePerson ? 'Two Answers. One Escape Artist.' : labels[result.alignment]}</h2><p>{result.summary}</p>{result.mainDisagreement && <p><strong>The rub:</strong> {result.mainDisagreement}</p>}{result.conversationStarter && <div className="starter"><span>WORTH ARGUING ABOUT</span><p>{result.conversationStarter}</p></div>}</section>;
}

function Settings({ onClear, onSignOut }: { onClear: () => void; onSignOut: () => void }) {
  return <section className="settings-panel"><p className="eyebrow">SETTINGS</p><h2>Keep it simple.</h2><div className="settings-list">
    <div><h3>Question History</h3><p>Recent Great Questions stay on this device to help avoid repeats.</p><button className="text-button" onClick={onClear}>Clear Question History</button></div>
    <div><h3>Private access</h3><p>Forget this device's saved access code.</p><button className="text-button text-button--danger" onClick={onSignOut}>Sign Out</button></div>
  </div><p className="version">THE THREE ORACLES · VERSION 1.1</p></section>;
}

function messageFor(cause: unknown): string {
  if (!navigator.onLine) return 'The Oracles need a network connection.';
  return cause instanceof Error ? cause.message : "The Oracles aren't answering right now. Try again.";
}
