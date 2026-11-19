import { useEffect, useState } from 'react';
import { ArrowUpRight, Bookmark, Clock3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import { useLanguage } from '@/lib/LanguageContext';
import { getSavedArticles, removeSavedArticle } from '@/lib/savedArticles';

export default function Saved() {
  const { t, lang } = useLanguage();
  const isId = lang !== 'en';
  const [articles, setArticles] = useState(getSavedArticles);

  useEffect(() => {
    const refresh = () => setArticles(getSavedArticles());
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const handleRemove = (articleId) => {
    setArticles(removeSavedArticle(articleId));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:px-8 lg:pb-16">
        <BrandHeader />
        <main className="mt-9 space-y-7 sm:mt-11">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bookmark className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{t('navigation.saved')}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t('saved.title')}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              {t('saved.subtitle')}
            </p>
          </div>

          {articles.length === 0 ? (
            <section className="glass flex min-h-[250px] flex-col items-center justify-center rounded-3xl px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/[0.045] text-foreground/70">
                <Bookmark className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <h2 className="mt-4 font-display text-base font-semibold text-foreground">{t('saved.empty.title')}</h2>
              <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">{t('saved.empty.description')}</p>
            </section>
          ) : (
            <section className="space-y-3">
              {articles.map((article) => (
                <div key={article.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <Link to={'/articles/' + article.id} className="min-w-0 flex-1 group">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                      {article.id}
                    </p>
                    <h2 className="mt-2 font-display text-base font-semibold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {article.title}
                    </h2>
                    {article.summary && <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">{article.summary}</p>}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {article.readingTimeMinutes || 1} {isId ? 'menit membaca' : 'min read'}
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(article.id)}
                    aria-label={isId ? 'Hapus artikel tersimpan' : 'Remove saved article'}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
