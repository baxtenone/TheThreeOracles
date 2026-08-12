import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { askOracles, generateQuestion, verifyAccess } from './lib/api';
import type { AnswerResult } from '../shared/contracts';

vi.mock('./lib/api', () => ({
  ApiError: class ApiError extends Error { status = 500; },
  verifyAccess: vi.fn(),
  askOracles: vi.fn(),
  generateQuestion: vi.fn()
}));

const answerResult: AnswerResult = {
  question: 'Could this work?',
  responses: [
    { person: 'Bruce', mode: 'answer', ballLabel: 'Worth trying.', fullAnswer: 'Prototype it.', expandedReasoning: null },
    { person: 'Kevin', mode: 'dodge', ballLabel: 'Still analyzing.', fullAnswer: 'Kevin wants another source.', expandedReasoning: null },
    { person: 'Travis', mode: 'answer', ballLabel: 'Check incentives.', fullAnswer: 'The constraints matter.', expandedReasoning: null }
  ],
  group: { alignment: 'mostly-agreed', summary: 'Bruce and Travis broadly agree while Kevin checks the evidence.', mainDisagreement: null, conversationStarter: 'What test comes first?', dodgePerson: 'Kevin' }
};

beforeEach(() => {
  localStorage.setItem('three-oracles:access', 'preview');
  vi.mocked(askOracles).mockResolvedValue(answerResult);
  vi.mocked(generateQuestion).mockResolvedValue({ question: 'Which supposedly simple problem should humanity have solved by now?', category: 'Surprise Me', optionalContext: null });
  vi.mocked(verifyAccess).mockResolvedValue(undefined);
});

it('uses Great Questions terminology and hides the default character count', () => {
  render(<App/>);
  expect(screen.getByRole('button', { name: 'Great Questions' })).toBeVisible();
  expect(screen.queryByText('Pose a Question')).not.toBeInTheDocument();
  expect(screen.queryByText('500')).not.toBeInTheDocument();
});

it('generates a Great Question and hands it directly to Ask the Oracles', async () => {
  const user = userEvent.setup();
  render(<App/>);
  await user.click(screen.getByRole('button', { name: 'Great Questions' }));
  await user.click(screen.getByRole('button', { name: /Find a Great Question/ }));
  const generated = await screen.findByText(/Which supposedly simple problem/);
  expect(generated).toBeVisible();
  await user.click(screen.getAllByRole('button', { name: /Ask the Oracles/ }).at(-1)!);
  expect(screen.getByLabelText('What do you want to know?')).toHaveValue('Which supposedly simple problem should humanity have solved by now?');
});

it('renders the one-dodge group summary and opens its intentional answer bubble', async () => {
  const user = userEvent.setup();
  render(<App/>);
  await user.type(screen.getByLabelText('What do you want to know?'), 'Could this work?');
  await user.click(screen.getAllByRole('button', { name: /^Ask the Oracles/ }).at(-1)!);
  await waitFor(() => expect(screen.getByText('Two Answers. One Escape Artist.')).toBeVisible());
  await user.click(screen.getByRole('button', { name: /Open Kevin/ }));
  expect(screen.getByRole('dialog', { name: /Kevin/ })).toBeVisible();
  expect(screen.getByText('Kevin wants another source.')).toBeVisible();
});

it('opens one answer cloud, switches Oracles, closes outside, and supports keyboard activation', async () => {
  const user = userEvent.setup();
  render(<App/>);
  await user.type(screen.getByLabelText('What do you want to know?'), 'Could this work?');
  await user.click(screen.getAllByRole('button', { name: /^Ask the Oracles/ }).at(-1)!);
  const bruce = await screen.findByRole('button', { name: /Open Bruce/ });
  const kevin = screen.getByRole('button', { name: /Open Kevin/ });

  bruce.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('dialog', { name: /Bruce/ })).toHaveTextContent('Prototype it.');
  await user.click(kevin);
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.getByRole('dialog', { name: /Kevin/ })).toHaveTextContent('Kevin wants another source.');

  fireEvent.pointerDown(screen.getByRole('heading', { name: /Three perspectives/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await waitFor(() => expect(kevin).toHaveFocus());
});

it('closes the cloud explicitly and returns focus to its Oracle trigger', async () => {
  const user = userEvent.setup();
  render(<App/>);
  await user.type(screen.getByLabelText('What do you want to know?'), 'Could this work?');
  await user.click(screen.getAllByRole('button', { name: /^Ask the Oracles/ }).at(-1)!);
  const bruce = await screen.findByRole('button', { name: /Open Bruce/ });
  await user.click(bruce);
  const close = screen.getByRole('button', { name: 'Close Oracle answer' });
  await waitFor(() => expect(close).toHaveFocus());
  await user.click(close);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await waitFor(() => expect(bruce).toHaveFocus());
});

it('resets Settings and open-answer state across sign-out/sign-in without erasing Great Question history', async () => {
  const user = userEvent.setup();
  const history = ['Why is toast better cut diagonally?'];
  localStorage.setItem('three-oracles:question-history', JSON.stringify(history));
  render(<App/>);
  await user.type(screen.getByLabelText('What do you want to know?'), 'Could this work?');
  await user.click(screen.getAllByRole('button', { name: /^Ask the Oracles/ }).at(-1)!);
  await user.click(await screen.findByRole('button', { name: /Open Travis/ }));
  expect(screen.getByRole('dialog', { name: /Travis/ })).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Open Settings' }));
  await user.click(screen.getByRole('button', { name: 'Sign Out' }));
  expect(screen.getByRole('heading', { name: /The Three Oracles/ })).toBeVisible();
  await user.type(screen.getByLabelText('Shared access code'), 'preview');
  await user.click(screen.getByRole('button', { name: /Enter the Room/ }));

  await waitFor(() => expect(screen.getByLabelText('What do you want to know?')).toBeVisible());
  expect(screen.queryByRole('heading', { name: 'Question History' })).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(localStorage.getItem('three-oracles:question-history')).toBe(JSON.stringify(history));
});

it('keeps Settings user-focused and does not expose profile implementation', async () => {
  const user = userEvent.setup();
  render(<App/>);
  await user.click(screen.getByRole('button', { name: 'Open Settings' }));
  expect(screen.getByRole('heading', { name: 'Question History' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Clear Question History' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Private access' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  expect(screen.queryByText(/profiles/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/oracleProfiles\.ts/i)).not.toBeInTheDocument();
});
