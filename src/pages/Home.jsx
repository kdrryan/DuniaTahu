import { ArrowRight, Bookmark, Clock3, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import { ARTICLES } from '@/data/articles';

function ArticleMeta({ minutes }) {
  return <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{minutes} min read</span>;
}

function ArticleCard({ article, featured = false }) {
  return (
    <article className={featured ? 'group overflow-hidden rounded-3xl border border-border/70 bg-card' : 'group rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40'}>
      {featured && (
        <div className="relative flex min-h-[190px] items-end overflow-hidden bg-muted px-5 py-5 sm:min-h-[230px] sm:px-7 sm:py-7">
          <div className="absolute right-7 top-5 h-28 w-28 rounded-full border border-foreground/10 sm:right-12 sm:top-7 sm:h-40 sm:w-40" />
          <div className="absolute right-14 top-12 h-14 w-14 rounded-full border border-foreground/15 sm:right-24 sm:top-16 sm:h-20 sm:w-20" />
          <div className="absolute right-[4.5rem] top-[4.5rem] h-2.5 w-2.5 rounded-full bg-blue-500 sm:right-[7.5rem] sm:top-[7.5rem]" />
          <span className="relative rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">{article.label}</span>
        </div>
      )}
      <div className={featured ? 'p-5 sm:p-7' : ''}>
        {!featured && (
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{article.category}</span>
            <button type="button" aria-label={`Save ${article.title}`} className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"><Bookmark className="h-4 w-4" /></button>
          </div>
        )}
        <h3 className={featured ? 'max-w-2xl font-display text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl' : 'font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground'}>{article.title}</h3>
        <p className={featured ? 'mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm' : 'mt-2 text-[12px] leading-relaxed text-muted-foreground'}>{article.summary}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <ArticleMeta minutes={article.readingTime} />
          {featured && <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground">Discover more <ArrowRight className="h-3.5 w-3.5" /></span>}
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const featured = ARTICLES.find((article) => article.featured);
  const picked = ARTICLES.filter((article) => !article.featured).slice(0, 2);
  const worthKnowing = ARTICLES.filter((article) => !article.featured).slice(2);

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:px-10 lg:pb-16">
        <BrandHeader />
        <main className="mt-9 space-y-10 sm:mt-12 sm:space-y-12">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">RATIO / DISCOVER</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Stay curious.</h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">Small discoveries. Bigger perspectives. Explore ideas worth understanding.</p>
            <div className="mt-6 flex h-12 max-w-2xl items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 text-muted-foreground shadow-sm shadow-black/[0.02]">
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-[13px]">Search anything to discover...</span>
              <span className="ml-auto hidden rounded-md border border-border px-2 py-1 text-[10px] sm:inline">⌘ K</span>
            </div>
          </section>

          {featured && <section className="space-y-4">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500" /><h2 className="text-[13px] font-semibold text-foreground">Today’s discovery</h2></div>
            <ArticleCard article={featured} featured />
          </section>}

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div><h2 className="text-[17px] font-semibold tracking-tight text-foreground">Picked for you</h2><p className="mt-1 text-[12px] text-muted-foreground">A few ideas to follow your curiosity</p></div>
              <Link to="/explore" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground">Explore <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">{picked.map((article) => <ArticleCard key={article.id} article={article} />)}</div>
          </section>

          {worthKnowing.length > 0 && <section className="space-y-4">
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground">Worth knowing</h2>
            <div className="grid gap-3 sm:grid-cols-2">{worthKnowing.map((article) => <ArticleCard key={article.id} article={article} />)}</div>
          </section>}

          <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/35 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Go deeper</p><h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">Curiosity is just the beginning.</h2><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Take any question further with a clear explanation from Ratio.</p></div>
            <Link to="/ratio#tanya" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-[12px] font-semibold text-background transition hover:opacity-85">Ask Ratio <ArrowRight className="h-3.5 w-3.5" /></Link>
          </section>
        </main>
        <footer className="mt-14 border-t border-border/70 pt-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ratio — Understand more.</footer>
      </div>
    </div>
  );
}
