import { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpRight, BookOpen, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import FunFactCard from '@/components/FunFactCard';
import AskBox from '@/components/AskBox';
import AnswerCard from '@/components/AnswerCard';
import HistoryList from '@/components/HistoryList';
import { fetchDailyFact, askWorld, fetchArticles } from '@/lib/api';
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
  const [featuredArticle, setFeaturedArticle] = useState(null);

  useEffect(() => {
    let alive = true;
    setFactLoading(true);
    setFact(null);
    fetchDailyFact(lang)
      .then((data) => {
        if (alive && data) setFact(data);
      })
      .catch((err) => {
        if (alive) {
          const allowedCodes = [
            'network',
            'timeout',
            'service',
            'request',
            'invalid_response',
            'empty_response',
          ];

    const code = allowedCodes.includes(err?.code)
      ? err.code
      : 'unknown';

    setError(t(`error.${code}`));
  }
})
      .finally(() => {
        if (alive) setFactLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lang]);

  useEffect(() => {
    let alive = true;
    fetchArticles(lang, 1)
      .then((articles) => {
        if (alive) setFeaturedArticle(articles[0] || null);
      })
      .catch(() => {
        if (alive) setFeaturedArticle(null);
      });
    return () => { alive = false; };
  }, [lang]);

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

  const allowedCodes = [
    'network',
    'timeout',
    'service',
    'request',
    'invalid_response',
    'empty_response',
  ];

  const code = allowedCodes.includes(err?.code)
    ? err.code
    : 'unknown';

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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-drift absolute -left-24 -top-32 h-72 w-72 rounded-full bg-[#93a7ff]/25 blur-3xl dark:bg-[#4d63ff]/14" />
        <div className="animate-drift absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#ffb69b]/22 blur-3xl dark:bg-[#ff7a52]/10" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#9becd4]/20 blur-3xl dark:bg-[#2ec39c]/10" />
      </div>

      <div className="mx-auto w-full max-w-2xl px-3.5 pb-14 pt-5 sm:px-6 sm:pt-7">
        <BrandHeader />

        <Link
          to={featuredArticle ? '/articles/' + featuredArticle.id : '/articles'}
          className="group mt-5 flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition hover:border-foreground/20 sm:mt-6 sm:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              {lang === 'en' ? 'Knowledge library' : 'Perpustakaan pengetahuan'}
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {featuredArticle?.title || (lang === 'en' ? 'Explore articles' : 'Jelajahi artikel')}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {featuredArticle?.summary || (lang === 'en' ? 'Research explained clearly.' : 'Riset dijelaskan dengan bahasa yang mudah dipahami.')}
            </p>
            {featuredArticle && (
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                {featuredArticle.readingTimeMinutes || 1} {lang === 'en' ? 'min read' : 'menit baca'}
              </span>
            )}
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </Link>

        <main className="mt-5 space-y-3.5 sm:mt-7 sm:space-y-4">
          <FunFactCard fact={fact} loading={factLoading} onExplain={explainFact} />

          <section id="tanya" className="glass scroll-mt-4 rounded-3xl p-3.5 sm:p-4">
            <AskBox onAsk={ask} loading={asking} />

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
