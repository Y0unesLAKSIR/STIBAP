const QUIZ_HISTORY_KEY = 'stibap.quiz_history';
export const QUIZ_HISTORY_EVENT = 'stibap:quiz-history-updated';

const hasWindow = typeof window !== 'undefined';

const safeParse = (value) => {
  try {
    return JSON.parse(value ?? '[]');
  } catch {
    return [];
  }
};

const readHistory = () => {
  if (!hasWindow) return [];
  const raw = window.localStorage.getItem(QUIZ_HISTORY_KEY);
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
};

const dispatchHistoryUpdate = () => {
  if (!hasWindow) return;
  window.dispatchEvent(new CustomEvent(QUIZ_HISTORY_EVENT));
};

const writeHistory = (history) => {
  if (!hasWindow) return;
  window.localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
  dispatchHistoryUpdate();
};

export const storeQuizResult = ({ score, total, grade_20, subject }) => {
  if (!hasWindow) return;
  const history = readHistory();
  const entry = {
    score: typeof score === 'number' ? score : undefined,
    total: typeof total === 'number' ? total : undefined,
    grade_20: typeof grade_20 === 'number' ? grade_20 : undefined,
    subject: subject || 'General',
    timestamp: Date.now(),
  };

  const filtered = history.filter((item) => item.timestamp !== entry.timestamp);
  filtered.unshift(entry);
  writeHistory(filtered.slice(0, 20));
};

export const readQuizHistory = () => readHistory();

export const getAverageQuizScore = () => {
  const history = readHistory();
  if (!history.length) return null;
  const totalScore = history.reduce((acc, entry) => {
    if (typeof entry.grade_20 === 'number') {
      return acc + entry.grade_20;
    }
    if (typeof entry.score === 'number' && typeof entry.total === 'number' && entry.total > 0) {
      return acc + (entry.score / entry.total) * 20;
    }
    return acc;
  }, 0);
  return totalScore / history.length;
};

export const getLatestQuizSubject = () => {
  const history = readHistory();
  if (!history.length) return '';
  return history[0]?.subject || '';
};
