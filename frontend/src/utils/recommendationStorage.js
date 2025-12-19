const QUIZ_KEY = 'stibap.quiz_recommendations';
const COURSE_KEY = 'stibap.course_interactions';
export const RECOMMENDATION_EVENT = 'stibap:recommendations-updated';

const hasWindow = typeof window !== 'undefined';

const dispatchUpdate = () => {
  if (!hasWindow) return;
  const event = new CustomEvent(RECOMMENDATION_EVENT);
  window.dispatchEvent(event);
};

const safeParse = (value) => {
  try {
    return JSON.parse(value ?? '[]');
  } catch {
    return [];
  }
};

const normalizeCourses = (courses) => {
  if (!Array.isArray(courses)) return [];
  const seen = new Set();
  const normalized = [];
  for (const course of courses) {
    const id = course?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    normalized.push(course);
  }
  return normalized;
};

const readList = (key) => {
  if (!hasWindow) return [];
  const raw = window.localStorage.getItem(key);
  const parsed = safeParse(raw);
  return normalizeCourses(parsed);
};

const writeList = (key, courses) => {
  if (!hasWindow) return;
  window.localStorage.setItem(key, JSON.stringify(courses));
  dispatchUpdate();
};

export const readQuizRecommendations = () => readList(QUIZ_KEY);
export const readCourseInteractions = () => readList(COURSE_KEY);

export const updateQuizRecommendations = (courses) => {
  const normalized = normalizeCourses(courses);
  if (normalized.length === 0) return;
  writeList(QUIZ_KEY, normalized.slice(0, 8));
};

export const recordCourseInteraction = (course) => {
  if (!course?.id) return;
  const existing = readList(COURSE_KEY);
  const filtered = existing.filter((entry) => entry.id !== course.id);
  const next = [course, ...filtered].slice(0, 8);
  writeList(COURSE_KEY, next);
};
