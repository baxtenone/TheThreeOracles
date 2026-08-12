import { createRequestLock } from './requestLock';

it('prevents duplicate requests from repeat taps', async () => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  const task = vi.fn(async () => { await waiting; return 'done'; });
  const locked = createRequestLock();
  const first = locked(task);
  expect(await locked(task)).toBeUndefined();
  expect(task).toHaveBeenCalledTimes(1);
  release();
  expect(await first).toBe('done');
});
