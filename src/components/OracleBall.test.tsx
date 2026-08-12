import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MysticBubble, OracleBall } from './OracleBall';

const normal = { person: 'Bruce', mode: 'answer', ballLabel: 'Worth trying.', fullAnswer: 'Build a small prototype and learn from it.', expandedReasoning: 'Make the first version reversible.' } as const;
const dodge = { person: 'Kevin', mode: 'dodge', ballLabel: 'Checking the evidence.', fullAnswer: 'Kevin wants one more source before committing.', expandedReasoning: null } as const;

it('opens from click/tap and displays only the short label in the sphere control', async () => {
  const onSelect = vi.fn();
  render(<OracleBall name="Bruce" response={normal} loading={false} selected={false} onSelect={onSelect}/>);
  await userEvent.click(screen.getByRole('button', { name: /Open Bruce/ }));
  expect(onSelect).toHaveBeenCalledOnce();
  expect(screen.getByText('Worth trying.')).toBeVisible();
  expect(screen.queryByText(normal.fullAnswer)).not.toBeInTheDocument();
});

it('renders normal and playful dodge content in mystic bubbles', () => {
  const { rerender } = render(<MysticBubble response={normal} onClose={() => undefined}/>);
  expect(screen.getByText(normal.fullAnswer)).toBeVisible();
  rerender(<MysticBubble response={dodge} onClose={() => undefined}/>);
  expect(screen.getByText(dodge.fullAnswer)).toBeVisible();
  expect(screen.getByText(/Oracle slips away/i)).toBeVisible();
});
