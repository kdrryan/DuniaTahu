import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  Share2,
  Type,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchArticle } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { isArticleSaved, toggleSavedArticle } from '@/lib/savedArticles';

function CitationParagraph({ content, sources, isId, fontSize }) {
  const parts = String(content || '').split(/(\[\d+\])/g);
  return (
    <p
      className="article-copy text-foreground/85"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
    >
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

function ActionButton({ label, onClick, children, active = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 transition hover:bg-foreground/[0.05] disabled:opacity-40 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/70'}`}
    >
      {children}
    </button>
  );
}

export default function ArticleDetail() {
  const { articleId } = useParams();
  const { lang } = useLanguage();
  const isId = lang !== 'en';
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(() => isArticleSaved(articleId));
  const [fontSize, setFontSize] = useState(17);
  const [showTypeControls, setShowTypeControls] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

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

  useEffect(() => {
    setSaved(isArticleSaved(articleId));
  }, [articleId]);

  const sources = Array.isArray(article?.sources) ? article.sources : [];
  const blocks = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];

  const handleBookmark = () => {
    if (!article) return;
    const result = toggleSavedArticle({
      ...article,
      id: article.id || article.articleId || articleId,
    });
    setSaved(result.saved);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: article?.title || 'Ratio',
          text: article?.summary || '',
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          setShareCopied(true);
          window.setTimeout(() => setShareCopied(false), 2200);
        } catch {
          setShareCopied(false);
        }
      }
    }
  };

  const title = isId ? 'Pengaturan teks' : 'Reading settings';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/75 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/articles"
              aria-label={isId ? 'Kembali ke daftar artikel' : 'Back to articles'}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/70 transition hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Ratio home">
              <img
                src="/brand/ratio-orbit-black-black-dot-light-background.png"
                alt=""
                aria-hidden="true"
                className="h-7 w-7 shrink-0 rounded-md object-contain dark:hidden"
              />
              <img
                src="/brand/ratio-orbit-white-white-dot-dark-background.png"
                alt=""
                aria-hidden="true"
                className="hidden h-7 w-7 shrink-0 rounded-md object-contain dark:block"
              />
              <span className="font-display text-[15px] font-semibold tracking-tight">Ratio</span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="relative">
              <ActionButton
                label={title}
                active={showTypeControls}
                onClick={() => setShowTypeControls((value) => !value)}
              >
                <Type className="h-[18px] w-[18px]" />
              </ActionButton>
              {showTypeControls && (
                <div className="absolute right-0 top-12 z-40 w-52 rounded-2xl border border-border bg-background p-3 shadow-xl">
                  <p className="px-1 text-xs font-semibold text-muted-foreground">{title}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setFontSize((size) => Math.max(15, size - 1))}
                      disabled={fontSize <= 15}
                      aria-label={isId ? 'Perkecil teks' : 'Decrease text size'}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-35"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold tabular-nums">{fontSize}px</span>
                    <button
                      type="button"
                      onClick={() => setFontSize((size) => Math.min(23, size + 1))}
                      disabled={fontSize >= 23}
                      aria-label={isId ? 'Perbesar teks' : 'Increase text size'}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-35"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <ActionButton
              label={saved ? (isId ? 'Hapus dari tersimpan' : 'Remove bookmark') : (isId ? 'Simpan artikel' : 'Save article')}
              active={saved}
              onClick={handleBookmark}
              disabled={!article}
            >
              {saved ? <BookmarkCheck className="h-[18px] w-[18px]" /> : <Bookmark className="h-[18px] w-[18px]" />}
            </ActionButton>
            <ActionButton
              label={shareCopied ? (isId ? 'Tautan disalin' : 'Link copied') : (isId ? 'Bagikan artikel' : 'Share article')}
              onClick={handleShare}
              disabled={!article}
            >
              {shareCopied ? <Check className="h-[18px] w-[18px]" /> : <Share2 className="h-[18px] w-[18px]" />}
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-9 sm:px-8 sm:pt-14">
        {loading && (
          <div className="space-y-5">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-12 space-y-4">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}

        {!loading && failed && (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <h1 className="mt-4 font-display text-xl font-semibold">
              {isId ? 'Artikel tidak dapat dimuat.' : 'This article could not be loaded.'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isId ? 'Periksa koneksi dan coba lagi.' : 'Check your connection and try again.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-foreground/[0.05]"
            >
              {isId ? 'Coba lagi' : 'Try again'}
            </button>
          </div>
        )}

        {!loading && !failed && article && (
          <article>
            <div className="border-b border-border/80 pb-8 sm:pb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                {isId ? 'Artikel pengetahuan' : 'Knowledge article'} <span className="px-1 text-muted-foreground">·</span> {article.id || articleId}
              </p>
              <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.14] tracking-tight sm:text-[2.65rem]">
                {article.title}
              </h1>
              {article.summary && (
                <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-[17px] sm:leading-8">
                  {article.summary}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {article.readingTimeMinutes || 1} {isId ? 'menit membaca' : 'min read'}
                </span>
                {formatDate(article.publishedAt, lang) && (
                  <span>{formatDate(article.publishedAt, lang)}</span>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-7 sm:mt-10 sm:space-y-9">
              {blocks.map((block, index) => {
                if (block.type === 'heading') {
                  return (
                    <h2 key={index} className="pt-2 font-display text-xl font-semibold leading-snug tracking-tight sm:text-[1.35rem]">
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
                      fontSize={fontSize}
                    />
                  );
                }
                return null;
              })}
            </div>

            <section id="sources" className="mt-14 border-t border-border pt-8 sm:mt-16">
              <h2 className="font-display text-xl font-semibold">
                {isId ? 'Sumber dan referensi' : 'Sources and references'}
              </h2>
              <div className="mt-5 space-y-5">
                {sources.map((source, index) => (
                  <div
                    id={'source-' + (index + 1)}
                    key={source.source_url || index}
                    className="scroll-mt-24 border-b border-border/70 pb-5 last:border-b-0"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {isId ? 'Referensi' : 'Reference'} [{index + 1}]
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6">{source.source_title}</p>
                    {source.citation_note && (
                      <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{source.citation_note}</p>
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

      {shareCopied && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-lg">
          {isId ? 'Tautan artikel disalin' : 'Article link copied'}
          <Copy className="ml-2 inline h-3 w-3" />
        </div>
      )}
    </div>
  );
}
