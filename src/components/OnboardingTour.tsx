import { FC, useState, useLayoutEffect, useEffect, useCallback } from 'react';

// Гайд-тур для новых пользователей (Вариант B контент, Вариант 3 стиль:
// подсветка кнопки + красная стрелка + подпись-плашка). Реальный UI на время
// тура неинтерактивен — оверлей ловит все тапы; тап в любом месте → след. шаг.

interface Step { sel: string[]; caption: string; }

const STEPS: Step[] = [
  { sel: ['.header-known'], caption: 'сколько английских слов ты уже знаешь — растёт по мере игры' },
  { sel: ['.level-bar'], caption: 'твой уровень и сколько слов до следующего' },
  { sel: ['.word-card'], caption: 'учишь слово в предложении. красное слово — главное. нажми карточку, чтобы услышать его' },
  { sel: ['.options-grid', '.manual-wrap'], caption: 'нажми перевод выделенного слова' },
  { sel: ['.flag-btn'], caption: 'отметь слово флажком, чтобы вернуться к нему' },
  { sel: ['.bottom-nav .nav-btn'], caption: 'тут темы, озвучка и режимы. без выбранных тем слов не будет' },
];

interface Rect { top: number; left: number; width: number; height: number; }
const PAD = 6;

const OnboardingTour: FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    const s = STEPS[step];
    if (!s) return;
    let el: Element | null = null;
    for (const sel of s.sel) { el = document.querySelector(sel); if (el) break; }
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    // Карточка/варианты могут ещё доезжать из IndexedDB — пере-замер через тик.
    const t = setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  const advance = () => {
    if (step >= STEPS.length - 1) { onFinish(); return; }
    setStep(step + 1);
  };

  const s = STEPS[step]!;
  const last = step === STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const below = rect ? rect.top + rect.height / 2 < vh * 0.5 : true;
  const cx = rect ? rect.left + rect.width / 2 : vw / 2;
  const clampCx = Math.max(20, Math.min(vw - 20, cx));

  return (
    <div className={`ob-overlay${rect ? '' : ' ob-overlay--dim'}`} onClick={advance}>
      {rect && (
        <div
          className="ob-spot"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}

      {rect && (
        <div
          className="ob-arrow"
          data-dir={below ? 'up' : 'down'}
          style={{ left: clampCx - 8, top: below ? rect.top + rect.height + 4 : rect.top - 15 }}
        />
      )}

      <div
        className="ob-cap"
        style={
          rect
            ? (below
                ? { top: rect.top + rect.height + 18, left: 16, right: 16 }
                : { bottom: vh - rect.top + 18, left: 16, right: 16 })
            : { top: '42%', left: 16, right: 16 }
        }
      >
        <span className="ob-cap-chip">{s.caption}</span>
      </div>

      <div className="ob-hint">{step + 1}/{STEPS.length} · {last ? 'нажми, чтобы начать' : 'нажми в любом месте'}</div>
    </div>
  );
};

export default OnboardingTour;
