import { boundedHistory, type Category, MAX_STORED_HISTORY } from '../../shared/contracts';

const ACCESS_KEY = 'three-oracles:access';
const HISTORY_KEY = 'three-oracles:question-history';
const CATEGORY_KEY = 'three-oracles:category';

export const accessStorage = {
  get: () => localStorage.getItem(ACCESS_KEY) ?? '',
  set: (code: string) => localStorage.setItem(ACCESS_KEY, code),
  clear: () => localStorage.removeItem(ACCESS_KEY)
};

export const questionHistory = {
  get(): string[] {
    try { return boundedHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')); } catch { return []; }
  },
  add(question: string): string[] {
    const next = [...questionHistory.get().filter((item) => item !== question), question].slice(-MAX_STORED_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  },
  clear: () => localStorage.removeItem(HISTORY_KEY)
};

export const categoryStorage = {
  get: (): Category => (localStorage.getItem(CATEGORY_KEY) as Category | null) ?? 'Surprise Me',
  set: (category: Category) => localStorage.setItem(CATEGORY_KEY, category)
};
