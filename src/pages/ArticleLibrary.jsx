import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import { fetchArticles } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

export default function ArticleLibrary() {
  const { lang } = useLanguage();
  const isId = lang !== 'en';
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    fetchArticles(lang, 50)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <BrandHeader />
        <main className="mt-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isId ? 'Kembali ke beranda' : 'Back to home'}
          </Link>

          <div className="mt-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              {isId ? 'Perpustakaan pengetahuan' : 'Knowledge library'}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {isId ? 'Temukan sesuatu yang baru.' : 'Discover something new.'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {isId
                ? 'Artikel pilihan yang disusun dari penelitian dan sumber tepercaya, dijelaskan dengan bahasa yang mudah dipahami.'
                : 'Curated articles built from research and trusted sources, explained in clear and accessible language.'}
            </p>
          </div>

          {loading && (
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-3xl border border-border bg-card/70" />
              ))}
            </div>
          )}

          {!loading && failed && (
            <div className="mt-9 rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">
              {isId
                ? 'Artikel belum dapat dimuat. Coba buka halaman ini kembali.'
                : 'Articles could not be loaded. Please try this page again.'}
            </div>
          )}

          {!loading && !failed && articles.length === 0 && (
            <div className="mt-9 rounded-3xl border border-border bg-card p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-4 font-semibold">
                {isId ? 'Belum ada artikel yang tersedia.' : 'No articles are available yet.'}
              </p>
            </div>
          )}

          {!loading && !failed && articles.length > 0 && (
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={'/articles/' + article.id}
                  className="group flex min-h-52 flex-col rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                      {isId ? 'Artikel pilihan' : 'Featured article'}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-semibold leading-snug tracking-tight">
                    {article.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {article.summary}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-5 text-xs font-medium text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {article.readingTimeMinutes || 1} {isId ? 'menit baca' : 'min read'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
