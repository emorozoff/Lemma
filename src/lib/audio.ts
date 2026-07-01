let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playCorrect(): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ac.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ac.currentTime + 0.08); // E5
    gain.gain.setValueAtTime(0.15, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.3);
  } catch (_) {}
}

export function playWrong(): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ac.currentTime);
    osc.frequency.setValueAtTime(180, ac.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.25);
  } catch (_) {}
}

export function playLevelUp(): void {
  try {
    const ac = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.12, ac.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.3);
      osc.start(ac.currentTime + i * 0.1);
      osc.stop(ac.currentTime + i * 0.1 + 0.3);
    });
  } catch (_) {}
}

// ─── TTS (pre-generated MP3) ─────────────────────────────────────────────────

// Мягкая (нестрогая) проверка ручного ввода: при включении ошибка в одну
// букву всё равно засчитывается. По умолчанию ВЫКЛ — ввод строгий (точное
// совпадение). Финал (последний ввод, который запоминает слово) всегда
// строгий независимо от этой настройки — см. MainScreen.
const LENIENT_INPUT_KEY = 'lenient_input';

export function isLenientInputEnabled(): boolean {
  return localStorage.getItem(LENIENT_INPUT_KEY) === 'true';
}

export function setLenientInputEnabled(v: boolean): void {
  localStorage.setItem(LENIENT_INPUT_KEY, v ? 'true' : 'false');
}

// Режим быстрого ввода: каждая карточка — ручной ввод английского по русскому,
// правильный ответ сразу уходит в архив (выучено). По умолчанию выключен.
const FAST_INPUT_KEY = 'fast_input_enabled';

export function isFastInputEnabled(): boolean {
  return localStorage.getItem(FAST_INPUT_KEY) === 'true';
}

export function setFastInputEnabled(v: boolean): void {
  localStorage.setItem(FAST_INPUT_KEY, v ? 'true' : 'false');
}

const TTS_KEY = 'tts_enabled';
const AUDIO_MODE_KEY = 'audio_mode';
const AUDIO_CDN = 'https://pub-00a95b8df66f46f597ce91f5544ae35f.r2.dev';
let currentSource: AudioBufferSourceNode | null = null;
let speechEndCallback: (() => void) | null = null;

// ─── Кеш ДЕКОДИРОВАННОГО аудио (мгновенное воспроизведение) ──────────────────
// «Загрузить все аудио» греет только HTTP-кеш service worker'а — при каждом
// воспроизведении всё равно шёл fetch → arrayBuffer → decodeAudioData (декод
// MP3 в PCM — это и есть задержка). Здесь держим уже декодированные AudioBuffer
// в памяти + предекодируем аудио текущей карточки, пока пользователь думает,
// чтобы при верном ответе play был синхронным и моментальным.
const bufferCache = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer | null>>();
const hashMemo = new Map<string, string>();
const MAX_CACHED = 80; // ~декодированных клипов в памяти (LRU-эвикшн по вставке)

function cachePut(key: string, buf: AudioBuffer): void {
  bufferCache.set(key, buf);
  if (bufferCache.size > MAX_CACHED) {
    const oldest = bufferCache.keys().next().value;
    if (oldest !== undefined) bufferCache.delete(oldest);
  }
}

// Возвращает декодированный AudioBuffer: из кеша мгновенно, иначе fetch+decode
// (с дедупликацией параллельных запросов через inflight). null при ошибке.
function loadBuffer(key: string, url: string): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const ac = getCtx();
  const p = fetch(url)
    .then(r => { if (!r.ok) throw new Error(r.statusText); return r.arrayBuffer(); })
    .then(buf => ac.decodeAudioData(buf))
    .then(audioBuffer => { cachePut(key, audioBuffer); inflight.delete(key); return audioBuffer; })
    .catch(() => { inflight.delete(key); return null; });
  inflight.set(key, p);
  return p;
}

// Синхронно запускает уже декодированный буфер. Ставит speechEndCallback/currentSource.
function playBuffer(buf: AudioBuffer, onEnd: () => void): void {
  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();
  speechEndCallback = onEnd;
  const source = ac.createBufferSource();
  source.buffer = buf;
  source.connect(ac.destination);
  currentSource = source;
  source.onended = () => {
    if (speechEndCallback) {
      const cb = speechEndCallback;
      speechEndCallback = null;
      currentSource = null;
      cb();
    }
  };
  source.start(0);
}

export type AudioMode = 'word' | 'sentence' | 'off';

export function getAudioMode(): AudioMode {
  const raw = localStorage.getItem(AUDIO_MODE_KEY);
  if (raw === 'word' || raw === 'sentence' || raw === 'off') return raw;
  // Legacy: 'both' (removed in v0.861) маппим на 'sentence' — самый близкий по сути режим.
  if (raw === 'both') return 'sentence';
  // Legacy: старый бинарный tts_enabled → off / word
  if (localStorage.getItem(TTS_KEY) === 'false') return 'off';
  return 'word';
}

export function setAudioMode(mode: AudioMode): void {
  localStorage.setItem(AUDIO_MODE_KEY, mode);
}

export function isTtsEnabled(): boolean {
  return getAudioMode() !== 'off';
}

function toSlug(word: string): string {
  return word
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// Предекодирует аудио слова в фоне (вызывать при показе карточки), чтобы
// последующий speakWord сыграл мгновенно из кеша. No-op если уже в кеше.
export function prepareWord(word: string): void {
  const slug = toSlug(word);
  if (!slug) return;
  const key = `w:${slug}`;
  if (bufferCache.has(key)) return;
  loadBuffer(key, `${AUDIO_CDN}/${slug}.mp3`);
}

export function speakWord(word: string, onEnd: () => void): void {
  stopSpeech();
  const slug = toSlug(word);
  if (!slug) { onEnd(); return; }

  const key = `w:${slug}`;
  const cached = bufferCache.get(key);
  if (cached) { playBuffer(cached, onEnd); return; } // мгновенно

  // Не декодировано заранее — грузим, затем играем (если не отменили).
  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();
  speechEndCallback = onEnd;
  loadBuffer(key, `${AUDIO_CDN}/${slug}.mp3`).then(buf => {
    if (!speechEndCallback) return; // stopSpeech успел отменить
    if (!buf) { const cb = speechEndCallback; speechEndCallback = null; cb(); return; }
    playBuffer(buf, speechEndCallback);
  });
}

export function stopSpeech(): void {
  speechEndCallback = null;
  if (currentSource) {
    try { currentSource.stop(); } catch (_) {}
    currentSource.onended = null;
    currentSource = null;
  }
}

// Предзагрузка всех аудио слов: фетчим каждый уникальный slug, чтобы service
// worker положил mp3 в CacheFirst-кеш (word-audio-cache). Уже закешированные
// отдаются мгновенно. onProgress(done, total) для прогресс-бара; shouldStop —
// для остановки пользователем.
export async function preloadAllAudio(
  words: string[],
  onProgress: (done: number, total: number) => void,
  shouldStop: () => boolean,
): Promise<void> {
  const slugs = [...new Set(words.map(toSlug).filter(Boolean))];
  const total = slugs.length;
  let done = 0;
  let idx = 0;
  onProgress(0, total);
  const CONCURRENCY = 6;
  async function worker(): Promise<void> {
    while (idx < slugs.length) {
      if (shouldStop()) return;
      const slug = slugs[idx++]!;
      try {
        await fetch(`${AUDIO_CDN}/${slug}.mp3`, { mode: 'cors' });
      } catch (_) {}
      done++;
      onProgress(done, total);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}

async function sentenceHash(text: string): Promise<string> {
  const memo = hashMemo.get(text);
  if (memo) return memo;
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  const short = hex.slice(0, 16);
  hashMemo.set(text, short);
  return short;
}

function cleanExample(example: string): string {
  return example.replace(/\*\*([^*]+)\*\*/g, '$1');
}

// Предекодирует аудио предложения в фоне (вызывать при показе карточки).
export function prepareSentence(example: string): void {
  const clean = cleanExample(example);
  if (!clean) return;
  sentenceHash(clean).then(hash => {
    const key = `s:${hash}`;
    if (bufferCache.has(key)) return;
    loadBuffer(key, `${AUDIO_CDN}/s_${hash}.mp3`);
  });
}

export function speakSentence(example: string, onEnd: () => void): void {
  stopSpeech();
  const clean = cleanExample(example);
  if (!clean) { onEnd(); return; }

  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();
  speechEndCallback = onEnd;

  sentenceHash(clean).then(hash => {
    if (!speechEndCallback) return; // stopSpeech успел отменить
    const key = `s:${hash}`;
    const cached = bufferCache.get(key);
    if (cached) { playBuffer(cached, speechEndCallback); return; } // мгновенно
    loadBuffer(key, `${AUDIO_CDN}/s_${hash}.mp3`).then(buf => {
      if (!speechEndCallback) return;
      if (!buf) { const cb = speechEndCallback; speechEndCallback = null; cb(); return; }
      playBuffer(buf, speechEndCallback);
    });
  });
}
