export function createRequestLock() {
  let active = false;
  return async function runOnce<T>(task: () => Promise<T>): Promise<T | undefined> {
    if (active) return undefined;
    active = true;
    try { return await task(); } finally { active = false; }
  };
}
