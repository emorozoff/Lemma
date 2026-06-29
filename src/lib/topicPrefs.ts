const KEY = 'lemma_topic_prefs';

// 0 = исключить, 1 = немного, 2 = очень интересно
export type PrefLevel = 0 | 1 | 2;
export type TopicPrefs = Record<string, PrefLevel>;

// Темы с возрастным ограничением — по умолчанию выключены
const ADULT_TOPIC_IDS = new Set(['swearing']);

export function loadTopicPrefs(): TopicPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTopicPrefs(prefs: TopicPrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function getPref(prefs: TopicPrefs, topicId: string): PrefLevel {
  const defaultLevel: PrefLevel = ADULT_TOPIC_IDS.has(topicId) ? 0 : 1;
  return (prefs[topicId] as PrefLevel | undefined) ?? defaultLevel;
}

export function getWeight(prefs: TopicPrefs, topicId: string): number {
  const p = getPref(prefs, topicId);
  if (p === 0) return 0;
  if (p === 1) return 1;
  return 3;
}
