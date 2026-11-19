import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

const GREETINGS = {
  id: [
    'Halo!!',
    'Nanya apa?',
    'Ada yang bikin penasaran?',
    'Aku siap bantu!',
    'Yuk, cari tahu sesuatu!',
    'Mau bahas apa hari ini?',
    'Punya pertanyaan seru?',
  ],
  en: [
    'Hello!!',
    'What’s on your mind?',
    'Curious about something?',
    'I’m ready to help!',
    'Let’s discover something!',
    'What shall we explore today?',
    'Got a fun question?',
  ],
};

export default function RatioMascot({ isTyping = false, isThinking = false, typingGaze = null }) {
  const { lang } = useLanguage();
  const [bubble, setBubble] = useState(null);
  const [canTap, setCanTap] = useState(true);
  const [isReacting, setIsReacting] = useState(false);
  const expression = isThinking ? 'thinking' : isTyping ? 'curious' : isReacting ? 'happy' : 'idle';
  const bubbleTimer = useRef(null);
  const cooldownTimer = useRef(null);
  const reactionTimer = useRef(null);
  const lastTap = useRef(0);
  const lastGreeting = useRef(-1);
  const headRef = useRef(null);
  const gazeResetTimer = useRef(null);
  const [screenGaze, setScreenGaze] = useState(null);

  useEffect(() => () => {
    window.clearTimeout(bubbleTimer.current);
    window.clearTimeout(cooldownTimer.current);
    window.clearTimeout(reactionTimer.current);
    window.clearTimeout(gazeResetTimer.current);
  }, []);

  useEffect(() => {
    if (isTyping || isThinking) return undefined;

    const updateGaze = (clientX, clientY) => {
      const rect = headRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = Math.max(-1, Math.min(1, (clientX - centerX) / (rect.width * 0.85)));
      const y = Math.max(-1, Math.min(1, (clientY - centerY) / (rect.height * 0.85)));

      setScreenGaze({ x, y });
      window.clearTimeout(gazeResetTimer.current);
      gazeResetTimer.current = window.setTimeout(() => setScreenGaze(null), 1800);
    };

    const onPointerDown = (event) => updateGaze(event.clientX, event.clientY);
    const onPointerMove = (event) => {
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        updateGaze(event.clientX, event.clientY);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointermove', onPointerMove);
      window.clearTimeout(gazeResetTimer.current);
    };
  }, [isThinking, isTyping]);

  const handleTap = () => {
    const now = Date.now();
    if (!canTap || now - lastTap.current < 3000) return;

    lastTap.current = now;
    setCanTap(false);
    setIsReacting(true);
    window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setIsReacting(false), 850);

    const greetings = GREETINGS[lang] || GREETINGS.id;
    let index = Math.floor(Math.random() * greetings.length);
    if (greetings.length > 1 && index === lastGreeting.current) {
      index = (index + 1 + Math.floor(Math.random() * (greetings.length - 1))) % greetings.length;
    }
    lastGreeting.current = index;

    window.clearTimeout(bubbleTimer.current);
    window.clearTimeout(cooldownTimer.current);
    setBubble(null);

    const nextBubble = {
      id: now,
      text: greetings[index],
      side: Math.random() > 0.5 ? 'left' : 'right',
      top: 18 + Math.floor(Math.random() * 42),
    };

    window.requestAnimationFrame(() => setBubble(nextBubble));
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 2250);
    cooldownTimer.current = window.setTimeout(() => setCanTap(true), 3000);
  };

  return (
    <section
      aria-label="Ratio Bot"
      className="flex items-center justify-center pb-4 pt-7 sm:pb-6 sm:pt-9"
    >
      <div className="relative flex h-48 w-full items-center justify-center sm:h-56">
        {bubble && (
          <div
            key={bubble.id}
            role="status"
            aria-live="polite"
            className={`ratio-bot-bubble absolute z-20 rounded-2xl border border-border/80 bg-card/95 px-2.5 py-2 text-[10.5px] font-medium leading-snug text-foreground shadow-lg backdrop-blur-md sm:px-3 sm:py-2 sm:text-[11px] ${bubble.side === 'left' ? 'left-0' : 'right-0'}`}
            style={{
              top: `${bubble.top}%`,
              width: 'min(7rem, calc((100% - 8.75rem) / 2))',
            }}
          >
            {bubble.text}
            <span
              aria-hidden="true"
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-border/80 bg-card/95 ${bubble.side === 'left' ? '-right-1.5 border-r border-t' : '-left-1.5 border-b border-l'}`}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleTap}
          aria-label={lang === 'en' ? 'Say hello to Ratio Bot' : 'Sapa Ratio Bot'}
          aria-disabled={!canTap}
          className={`ratio-bot-float relative z-10 flex h-32 w-32 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#52769A] sm:h-36 sm:w-36 ${canTap ? 'active:scale-[0.98]' : 'cursor-default'}`}
        >
          <span
            ref={headRef}
            className={`ratio-bot-head relative flex h-full w-full items-center justify-center rounded-full bg-[#050506] ${isReacting ? 'ratio-bot-reacting' : ''}`}
          >
            <span className={`ratio-bot-face ratio-bot-face-${expression} relative z-10 flex items-center justify-center`}>
              <span
                className={`ratio-bot-eyes absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[18px] ${isThinking ? 'ratio-bot-eyes-thinking' : isTyping || screenGaze ? 'ratio-bot-eyes-tracking' : 'ratio-bot-eyes-idle'}`}
                style={{
                  '--gaze-x': `${(isTyping ? (typingGaze?.x ?? 0) : (screenGaze?.x ?? 0)) * 8}px`,
                  '--gaze-y': `${isTyping ? ((typingGaze?.y ?? 0.5) - 0.5) * 8 : (screenGaze?.y ?? 0) * 6}px`,
                }}
                role={isThinking ? 'status' : undefined}
                aria-label={isThinking ? (lang === 'en' ? 'Thinking' : 'Sedang berpikir') : undefined}
              >
                <span className="ratio-bot-eye ratio-bot-eye-left block h-[34px] w-[15px] rounded-full bg-white sm:h-[38px] sm:w-[17px]" />
                {isThinking && (
                  <span className="ratio-bot-eye ratio-bot-eye-center block h-[34px] w-[15px] rounded-full bg-white sm:h-[38px] sm:w-[17px]" />
                )}
                <span className="ratio-bot-eye ratio-bot-eye-right block h-[34px] w-[15px] rounded-full bg-white sm:h-[38px] sm:w-[17px]" />
              </span>
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
