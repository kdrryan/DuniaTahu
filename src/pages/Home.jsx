import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Clock3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import { fetchArticles } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

export default function Home() {
  const { lang, t } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const isId = lang !== 'en';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    fetchArticles(lang, 6)
      .then((items) => {
        if (active) setArticles(items);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [lang]);

  const featured = articles[0];
  const moreArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:px-10 lg:pb-16">
        <BrandHeader />

        <main className="mt-9 space-y-9 sm:mt-12 sm:space-y-11">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t('home.discover.eyebrow')}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t('home.discover.title')}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              {t('home.discover.subtitle')}
            </p>
          </section>

          {loading && (
            <section className="space-y-3">
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
              <div className="h-48 animate-pulse rounded-3xl border border-border bg-card/70" />
            </section>
          )}

          {!loading && failed && (
            <section className="rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
              {t('home.discover.failed')}
            </section>
          )}

          {!loading && !failed && articles.length === 0 && (
            <section className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 font-semibold text-foreground">{t('home.discover.empty')}</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t('home.discover.emptyDescription')}
              </p>
            </section>
          )}

          {!loading && !failed && featured && (
            <>
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <h2 className="text-[13px] font-semibold text-foreground">{t('home.discover.featured')}</h2>
                </div>
                <Link
                  to={'/articles/' + featured.id}
                  className="group block overflow-hidden rounded-3xl border border-border/70 bg-card p-5 transition hover:border-foreground/20 sm:p-7"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                      {t('home.discover.knowledgeArticle')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                  <h2 className="mt-5 max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                    {featured.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {featured.readingTimeMinutes || 1} {t('home.discover.readingTime')}
                  </span>
                </Link>
              </section>

              {moreArticles.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-[17px] font-semibold tracking-tight text-foreground">{t('home.discover.more')}</h2>
                      <p className="mt-1 text-[12px] text-muted-foreground">{t('home.discover.moreSubtitle')}</p>
                    </div>
                    <Link to="/explore" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground">
                      {t('home.discover.exploreAll')} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {moreArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={'/articles/' + article.id}
                        className="rounded-2xl border border-border/70 bg-card p-4 transition hover:border-foreground/20"
                      >
                        <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
                          {article.summary}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {article.readingTimeMinutes || 1} {t('home.discover.readingTime')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/35 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{t('home.discover.goDeeper')}</p>
              <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">{t('home.discover.askTitle')}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{t('home.discover.askDescription')}</p>
            </div>
            <Link to="/ratio#tanya" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background transition hover:opacity-85">
              {t('navigation.ratio')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </main>

        <footer className="mt-14 border-t border-border/70 pt-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Ratio — Understand more.
        </footer>
      </div>
    </div>
  );
}
