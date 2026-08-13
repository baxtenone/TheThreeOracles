import { type FormEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES, MAX_QUESTION_LENGTH, PEOPLE, recentHistoryForApi, type AnswerResult, type Category, type DiscussionResult } from '../shared/contracts';
import { LightningLayer } from './components/LightningLayer';
import { MysticBubble, OracleBall } from './components/OracleBall';
import { ApiError, askOracles, generateQuestion, verifyAccess } from './lib/api';
import { shuffleOracles, type OraclePerson } from './lib/experience';
import { accessStorage, categoryStorage, questionHistory } from './lib/storage';

type View = 'ask' | 'results' | 'pose' | 'settings';

export default function App({ random = Math.random, lightningRandom = Math.random }: { random?: () => number; lightningRandom?: () => number }) {
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
  const [oracleOrder, setOracleOrder] = useState<OraclePerson[]>(() => [...PEOPLE]);
  const [questionOpen, setQuestionOpen] = useState(false);
  const inFlight = useRef(false);
  const oracleButtons = useRef<Partial<Record<(typeof PEOPLE)[number], HTMLButtonElement>>>({});
  const answerCloseButton = useRef<HTMLButtonElement>(null);
  const lastAnswerTrigger = useRef<HTMLButtonElement | null>(null);
  const questionButton = useRef<HTMLButtonElement>(null);
  const questionCloseButton = useRef<HTMLButtonElement>(null);
  const answerByPerson = useMemo(() => new Map(answers?.responses.map((item) => [item.person, item])), [answers]);
  const selectedResponse = selectedPerson ? answerByPerson.get(selectedPerson) : undefined;

  useEffect(() => {
    if (!selectedPerson && !questionOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target;
      if (selectedPerson && target instanceof Element && !target.closest('[data-oracle-interactive], [data-oracle-bubble]')) closeAnswer();
      if (questionOpen && target instanceof Element && !target.closest('[data-question-popup], .question-button')) closeQuestion();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedPerson) closeAnswer();
      if (questionOpen) closeQuestion();
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedPerson, questionOpen]);

  useEffect(() => {
    if (!selectedResponse) return;
    const timer = window.setTimeout(() => answerCloseButton.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [selectedResponse]);

  useEffect(() => {
    if (!questionOpen) return;
    const timer = window.setTimeout(() => questionCloseButton.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [questionOpen]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessCode.trim() || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      await verifyAccess(accessCode.trim());
      accessStorage.set(accessCode.trim());
      resetTransientState();
      setAuthenticated(true);
    }
    catch (cause) { setError(messageFor(cause)); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function submitQuestion(event?: FormEvent) {
    event?.preventDefault();
    const clean = question.trim();
    if (!clean) return setError('Give the Oracles a question first.');
    if (clean.length > MAX_QUESTION_LENGTH) return setError(`Keep the question under ${MAX_QUESTION_LENGTH} characters.`);
    void startAsk(clean);
  }

  async function startAsk(clean: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setQuestion(clean); setOracleOrder(shuffleOracles(random)); setView('results'); setBusy(true); setError(''); setAnswers(null); setSelectedPerson(null); setQuestionOpen(false);
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

  function resetTransientState() { setView('ask'); setQuestion(''); setAnswers(null); setGenerated(null); setSelectedPerson(null); setQuestionOpen(false); setOracleOrder([...PEOPLE]); setError(''); }
  function signOut() { accessStorage.clear(); resetTransientState(); setAuthenticated(false); setAccessCode(''); }
  function closeAnswer(returnFocus = true) {
    setSelectedPerson(null);
    if (returnFocus) window.setTimeout(() => lastAnswerTrigger.current?.focus(), 0);
  }
  function closeQuestion(returnFocus = true) {
    setQuestionOpen(false);
    if (returnFocus) window.setTimeout(() => questionButton.current?.focus(), 0);
  }
  function toggleQuestion() {
    if (questionOpen) return closeQuestion(false);
    closeAnswer(false); setQuestionOpen(true);
  }
  function showView(nextView: View) { setSelectedPerson(null); setQuestionOpen(false); setView(nextView); setError(''); }
  function backToAsk() { setSelectedPerson(null); setQuestionOpen(false); setAnswers(null); setOracleOrder([...PEOPLE]); setView('ask'); setError(''); }
  function selectPerson(person: (typeof PEOPLE)[number]) {
    if (selectedPerson === person) return closeAnswer(false);
    setQuestionOpen(false);
    lastAnswerTrigger.current = oracleButtons.current[person] ?? null;
    setSelectedPerson(person);
  }
  function handleApiError(cause: unknown) { if (cause instanceof ApiError && cause.status === 401) signOut(); setError(messageFor(cause)); }
  function askGenerated() {
    if (!generated) return;
    void startAsk(generated.question);
  }

  if (!authenticated) return <AccessGate code={accessCode} setCode={setAccessCode} submit={authenticate} busy={busy} error={error} />;

  return <><div className={`app-shell app-shell--${view} ${selectedResponse ? 'app-shell--cloud-open' : ''} ${questionOpen ? 'app-shell--question-open' : ''}`}>
    <LightningLayer random={lightningRandom}/>
    {view !== 'results' && <header className="topbar">
      <button className="brand" onClick={() => showView('ask')} aria-label="The Three Oracles home"><span className="brand__mark">◈</span><span>THE THREE ORACLES</span></button>
      <button className="icon-button" onClick={() => showView('settings')} aria-label="Open Settings">•••</button>
    </header>}
    <main>
      {view !== 'results' && <><section className="hero"><p className="eyebrow">BRUCE <span>•</span> KEVIN <span>•</span> TRAVIS</p><h1>Three perspectives.<br/><em>One question.</em></h1></section>
      <nav className="mode-switch" aria-label="Choose an Oracle mode">
        <button className={view === 'ask' ? 'active' : ''} onClick={() => showView('ask')}>Ask the Oracles</button>
        <button className={view === 'pose' ? 'active' : ''} onClick={() => showView('pose')}>Great Questions</button>
      </nav></>}

      {view === 'ask' && <>
        <form className="ask-panel" onSubmit={submitQuestion}>
          <label htmlFor="oracle-question">What do you want to know?</label>
          <textarea id="oracle-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={MAX_QUESTION_LENGTH} placeholder="Should humans colonize Mars?" rows={3} disabled={busy}/>
          <div className="ask-panel__footer">{MAX_QUESTION_LENGTH - question.length < 75 ? <span className="count" aria-live="polite">{MAX_QUESTION_LENGTH - question.length} left</span> : <span/>}<button className="primary-button" disabled={busy || !question.trim()}>{busy ? 'Consulting…' : 'Ask the Oracles'} <span aria-hidden="true">→</span></button></div>
        </form>
      </>}

      {view === 'results' && <section className="results-screen" aria-busy={busy}>
        <div className="results-controls">
          <button className="results-back" onClick={backToAsk}><span aria-hidden="true">←</span> Back</button>
          <button ref={questionButton} className="question-button" onClick={toggleQuestion} aria-label={questionOpen ? 'Hide question' : 'Show question'} aria-expanded={questionOpen}>?</button>
        </div>
        <div className="oracle-triangle" aria-label="The Three Oracles" aria-live="polite">
          {oracleOrder.map((person, index) => <div key={person} className={`oracle-triangle__slot oracle-triangle__slot--${index === 0 ? 'top' : index === 1 ? 'left' : 'right'}`} data-position={index === 0 ? 'top' : index === 1 ? 'bottom-left' : 'bottom-right'}>
            <OracleBall name={person} response={answerByPerson.get(person)} loading={busy} selected={selectedPerson === person} buttonRef={(node) => { oracleButtons.current[person] = node ?? undefined; }} onSelect={() => selectPerson(person)}/>
          </div>)}
        </div>
        {answers && <GroupResult result={answers.group}/>}
        {!busy && !answers && error && <div className="notice" role="alert">{error}</div>}
      </section>}

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
      {view !== 'results' && error && <div className="notice" role="alert">{error}</div>}
    </main>
    <footer>BRASADA RANCH · V1.2</footer>
    {questionOpen && <QuestionPopup question={question} closeRef={questionCloseButton} onClose={() => closeQuestion()}/>}
  </div>{selectedResponse && createPortal(<div className="answer-cloud-layer" aria-live="polite"><MysticBubble ref={answerCloseButton} response={selectedResponse} onClose={() => closeAnswer()} onCloudTap={() => closeAnswer()}/></div>, document.body)}</>;
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
  return <section className="group-result"><div className="group-result__meta"><p className="eyebrow">THE ORACLES SAY</p><span>{labels[result.alignment]}</span></div><h2>{result.dodgePerson ? 'Two Answers. One Escape Artist.' : labels[result.alignment]}</h2><p>{result.summary}</p>{result.conversationStarter && <div className="starter"><span>WORTH ARGUING ABOUT</span><p>{result.conversationStarter}</p></div>}</section>;
}

function QuestionPopup({ question, closeRef, onClose }: { question: string; closeRef: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  return <><div className="question-popup-layer" onPointerDown={onClose}/>
    <section className="question-popup" data-question-popup role="dialog" aria-modal="false" aria-labelledby="question-popup-title">
      <button ref={closeRef} className="question-popup__close" onClick={onClose} aria-label="Close question">×</button>
      <p id="question-popup-title">YOU ASKED</p><blockquote>{question}</blockquote>
    </section>
  </>;
}

function Settings({ onClear, onSignOut }: { onClear: () => void; onSignOut: () => void }) {
  return <section className="settings-panel"><p className="eyebrow">SETTINGS</p><h2>Keep it simple.</h2><div className="settings-list">
    <div><h3>Question History</h3><p>Recent Great Questions stay on this device to help avoid repeats.</p><button className="text-button" onClick={onClear}>Clear Question History</button></div>
    <div><h3>Private access</h3><p>Forget this device's saved access code.</p><button className="text-button text-button--danger" onClick={onSignOut}>Sign Out</button></div>
  </div><p className="version">THE THREE ORACLES · VERSION 1.2</p></section>;
}

function messageFor(cause: unknown): string {
  if (!navigator.onLine) return 'The Oracles need a network connection.';
  return cause instanceof Error ? cause.message : "The Oracles aren't answering right now. Try again.";
}
