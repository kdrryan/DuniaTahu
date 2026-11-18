import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Clock3, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import { fetchArticle } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';

function CitationParagraph({ content, sources, isId }) {
  const parts = String(content || '').split(/(\[\d+\])/g);
  return (
    <p className="text-[15px] leading-8 text-foreground/85 sm:text-base sm:leading-9">
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return part;
        const sourceNumber = Number(match[1]);
        const sourceExists = sourceNumber > 0 && sourceNumber <= sources.length;
        return sourceExists ? (
          <sup key={index} className="ml-0.5 align-super text-[11px] font-semibold">
            <a
              href={'#source-' + sourceNumber}
              className="rounded px-0.5 text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:text-blue-500 dark:text-blue-400"
              aria-label={(isId ? 'Lihat sumber ' : 'View source ') + sourceNumber}
            >
              [{sourceNumber}]
            </a>
          </sup>
        ) : (
          <sup key={index} className="ml-0.5 align-super text-[11px] text-muted-foreground">{part}</sup>
        );
      })}
    </p>
  );
}

function formatDate(value, lang) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + (String(value).endsWith('Z') ? '' : 'Z'));
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

export default function ArticleDetail() {
  const { articleId } = useParams();
  const { lang } = useLanguage();
  const isId = lang !== 'en';
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setArticle(null);
    fetchArticle(articleId)
      .then((item) => { if (active) setArticle(item); })
      .catch(() => { if (active) setFailed(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [articleId]);

  const sources = Array.isArray(article?.sources) ? article.sources : [];
  const blocks = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-5 sm:px-6 sm:pt-8">
        <BrandHeader />
        <main className="mx-auto mt-9 max-w-3xl">
          <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isId ? 'Semua artikel' : 'All articles'}
          </Link>

          {loading && (
            <div className="mt-10 space-y-5">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-12 h-64 animate-pulse rounded-3xl bg-muted" />
            </div>
          )}

          {!loading && failed && (
            <div className="mt-10 rounded-3xl border border-border bg-card p-7">
              <BookOpen className="h-7 w-7 text-muted-foreground" />
              <h1 className="mt-4 font-display text-xl font-semibold">
                {isId ? 'Artikel tidak dapat dimuat.' : 'This article could not be loaded.'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {isId ? 'Periksa koneksi dan coba lagi.' : 'Check your connection and try again.'}
              </p>
            </div>
          )}

          {!loading && !failed && article && (
            <article className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                {isId ? 'Ratio · Artikel pengetahuan' : 'Ratio · Knowledge article'}
              </p>
              <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl">
                {article.title}
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                {article.summary}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-6 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {article.readingTimeMinutes || 1} {isId ? 'menit baca' : 'min read'}
                </span>
                {formatDate(article.publishedAt, lang) && (
                  <span>{formatDate(article.publishedAt, lang)}</span>
                )}
              </div>

              <div className="mt-9 space-y-7 sm:mt-12 sm:space-y-9">
                {blocks.map((block, index) => {
                  if (block.type === 'heading') {
                    return (
                      <h2 key={index} className="pt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                        {block.content}
                      </h2>
                    );
                  }
                  if (block.type === 'paragraph') {
                    return (
                      <CitationParagraph
                        key={index}
                        content={block.content}
                        sources={sources}
                        isId={isId}
                      />
                    );
                  }
                  return null;
                })}
              </div>

              <section id="sources" className="mt-14 border-t border-border pt-8">
                <h2 className="font-display text-xl font-semibold">
                  {isId ? 'Sumber dan referensi' : 'Sources and references'}
                </h2>
                <div className="mt-4 space-y-3">
                  {sources.map((source, index) => (
                    <div
                      id={'source-' + (index + 1)}
                      key={source.source_url || index}
                      className="scroll-mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {isId ? 'Sumber' : 'Source'} [{index + 1}] · {source.display_name}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6">{source.source_title}</p>
                      {source.citation_note && (
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">{source.citation_note}</p>
                      )}
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {isId ? 'Buka sumber asli' : 'Open original source'}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                  {sources.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {isId ? 'Informasi sumber belum tersedia.' : 'Source information is not available.'}
                    </p>
                  )}
                </div>
              </section>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
