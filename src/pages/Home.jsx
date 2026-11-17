import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import BrandHeader from '@/components/BrandHeader';
import FunFactCard from '@/components/FunFactCard';
import AskBox from '@/components/AskBox';
import AnswerCard from '@/components/AnswerCard';
import HistoryList from '@/components/HistoryList';
import { fetchDailyFact, askWorld } from '@/lib/api';
import { loadHistory, saveHistory } from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext';

export default function Home() {
  const { lang, t } = useLanguage();
  const [fact, setFact] = useState(null);
  const [factLoading, setFactLoading] = useState(true);
  const [history, setHistory] = useState(loadHistory);
  const [current, setCurrent] = useState(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setFactLoading(true);
    setFact(null);
    fetchDailyFact(lang)
      .then((data) => {
        if (alive && data) setFact(data);
      })
      .catch((err) => {
        if (!alive) return;
        const allowedCodes = ['network', 'timeout', 'service', 'request', 'invalid_response', 'empty_response'];
        const code = allowedCodes.includes(err?.code) ? err.code : 'unknown';
        setError(t(`error.${code}`));
      })
      .finally(() => {
        if (alive) setFactLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lang, t]);

  useEffect(() => {
    if (!current) return;
    document.getElementById('jawaban')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current?.id]);

  const ask = async (question) => {
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
      const allowedCodes = ['network', 'timeout', 'service', 'request', 'invalid_response', 'empty_response'];
      const code = allowedCodes.includes(err?.code) ? err.code : 'unknown';
      setError(t(`error.${code}`));
    } finally {
      setAsking(false);
    }
  };

  const explainFact = (dailyFact) => {
    if (!dailyFact) return;
    ask(`${t('home.explain')} "${dailyFact.fact}"`);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    setCurrent(null);
  };

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/[0.055] blur-3xl dark:bg-blue-400/[0.07]" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-7 sm:pb-16 sm:pt-8 lg:px-8">
        <BrandHeader />

        <main className="mt-7 space-y-5 sm:mt-9 sm:space-y-6">
          <FunFactCard fact={fact} loading={factLoading} onExplain={explainFact} />

          <section id="tanya" className="glass scroll-mt-5 rounded-3xl p-4 sm:p-5">
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('header.cta')}
              </p>
            </div>
            <AskBox onAsk={ask} loading={asking} />

            {error && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-destructive/10 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </section>

          {(asking || current) && (
            <div id="jawaban" className="scroll-mt-5">
              <AnswerCard entry={current} loading={asking} />
            </div>
          )}

          <HistoryList items={history} onClear={clearHistory} />

          <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">{t('home.notice')}</p>
        </main>

        <footer className="mt-12 border-t border-border/70 pt-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('home.footer')}
        </footer>
      </div>
    </div>
  );
}
