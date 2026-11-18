import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import AskBox from '@/components/AskBox';
import AnswerCard from '@/components/AnswerCard';
import HistoryList from '@/components/HistoryList';
import RatioMascot from '@/components/RatioMascot';
import { askWorld } from '@/lib/api';
import { loadHistory, saveHistory } from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext';

export default function Ratio() {
  const { lang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const handledInitialQuestion = useRef(null);
  const [history, setHistory] = useState(loadHistory);
  const [current, setCurrent] = useState(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingGaze, setTypingGaze] = useState(null);

  useEffect(() => {
    if (!current) return;
    document.getElementById('jawaban')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current?.id]);

  const ask = useCallback(async (question) => {
    const trimmed = question?.trim();
    if (!trimmed || asking) return;
    setAsking(true);
    setError('');
    try {
      const result = await askWorld({ question: trimmed, lang });
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        question: trimmed,
        created_at: new Date().toISOString(),
        ...result,
      };
      const next = [entry, ...history].slice(0, 60);
      setHistory(next);
      saveHistory(next);
      setCurrent(entry);
    } catch (err) {
      console.error('ASK ERROR:', err);
      const allowedCodes = [
        'network',
        'timeout',
        'service',
        'request',
        'invalid_response',
        'empty_response',
      ];
      const code = allowedCodes.includes(err?.code) ? err.code : 'unknown';
      setError(t(`error.${code}`));
    } finally {
      setAsking(false);
    }
  }, [asking, history, lang, t]);

  useEffect(() => {
    const initialQuestion = location.state?.initialQuestion;
    if (typeof initialQuestion !== 'string' || !initialQuestion.trim()) return;
    if (handledInitialQuestion.current === location.key) return;

    handledInitialQuestion.current = location.key;
    navigate(`${location.pathname}${location.hash}`, { replace: true, state: null });
    ask(initialQuestion);
  }, [ask, location.hash, location.key, location.pathname, location.state, navigate]);

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setCurrent(null);
  };

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-drift absolute -left-24 -top-32 h-72 w-72 rounded-full bg-[#93a7ff]/25 blur-3xl dark:bg-[#4d63ff]/14" />
        <div className="animate-drift absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#ffb69b]/22 blur-3xl dark:bg-[#ff7a52]/10" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#9becd4]/20 blur-3xl dark:bg-[#2ec39c]/10" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-3.5 pb-14 pt-5 sm:px-6 sm:pt-7">
        <BrandHeader />

        <RatioMascot isTyping={isTyping} isThinking={asking} typingGaze={typingGaze} />

        <main className="mt-1 space-y-3.5 sm:mt-2 sm:space-y-4">
          <section id="tanya" className="glass scroll-mt-4 rounded-3xl p-3.5 sm:p-4">
            <AskBox onAsk={ask} loading={asking} onTypingChange={setIsTyping} onGazeChange={setTypingGaze} />

            {error && (
              <p className="mt-3 flex items-center gap-2 rounded-2xl bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}
          </section>

          {(asking || current) && (
            <div id="jawaban" className="scroll-mt-4">
              <AnswerCard entry={current} loading={asking} />
            </div>
          )}

          <HistoryList items={history} onClear={clearHistory} />

          <p className="px-2 text-[11px] leading-relaxed text-muted-foreground">{t('home.notice')}</p>
        </main>

        <footer className="mt-10 border-t border-foreground/8 pt-4 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('home.footer')}
        </footer>
      </div>
    </div>
  );
}
