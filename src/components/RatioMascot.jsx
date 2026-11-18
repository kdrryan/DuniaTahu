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

export default function RatioMascot({ isTyping = false }) {
  const { lang } = useLanguage();
  const [bubble, setBubble] = useState(null);
  const [canTap, setCanTap] = useState(true);
  const bubbleTimer = useRef(null);
  const cooldownTimer = useRef(null);
  const lastTap = useRef(0);
  const lastGreeting = useRef(-1);

  useEffect(() => () => {
    window.clearTimeout(bubbleTimer.current);
    window.clearTimeout(cooldownTimer.current);
  }, []);

  const handleTap = () => {
    const now = Date.now();
    if (!canTap || now - lastTap.current < 3000) return;

    lastTap.current = now;
    setCanTap(false);

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
            className={`ratio-bot-bubble absolute z-20 max-w-[46%] rounded-2xl border border-border/80 bg-card/95 px-3.5 py-2.5 text-[12px] font-medium leading-snug text-foreground shadow-lg backdrop-blur-md sm:max-w-[40%] sm:px-4 sm:py-3 sm:text-sm ${bubble.side === 'left' ? 'left-0' : 'right-0'}`}
            style={{ top: `${bubble.top}%` }}
          >
            {bubble.text}
            <span
              aria-hidden="true"
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-border/80 bg-card/95 ${bubble.side === 'left' ? '-right-1.5 border-r border-t' : '-left-1.5 border-b border-l'}`}
            />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute h-40 w-40 rounded-full bg-[#52769A]/20 blur-3xl sm:h-48 sm:w-48"
        />
        <div
          aria-hidden="true"
          className="ratio-bot-shadow absolute bottom-5 h-3 w-24 rounded-[50%] bg-black/20 blur-[5px] dark:bg-black/45 sm:bottom-6"
        />

        <button
          type="button"
          onClick={handleTap}
          aria-label={lang === 'en' ? 'Say hello to Ratio Bot' : 'Sapa Ratio Bot'}
          aria-disabled={!canTap}
          className={`ratio-bot-float relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-[#050506] shadow-[0_12px_38px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.06] outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[#52769A] sm:h-36 sm:w-36 ${canTap ? 'active:scale-[0.96]' : 'cursor-default'}`}
        >
          <span className={`ratio-bot-eyes flex items-center gap-[18px] ${isTyping ? 'ratio-bot-eyes-typing' : 'ratio-bot-eyes-idle'}`}>
            <span className="ratio-bot-eye ratio-bot-eye-left block h-[34px] w-[15px] rotate-[-18deg] rounded-full bg-white sm:h-[38px] sm:w-[17px]" />
            <span className="ratio-bot-eye ratio-bot-eye-right block h-[34px] w-[15px] rotate-[-12deg] rounded-full bg-white sm:h-[38px] sm:w-[17px]" />
          </span>
        </button>
      </div>
    </section>
  );
}
