import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { askOracles, generateQuestion } from './lib/api';
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
  expect(screen.getByText('Kevin wants another source.')).toBeVisible();
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
