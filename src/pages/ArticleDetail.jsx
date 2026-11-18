import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock3,
  ExternalLink,
  List,
  Moon,
  Sun,
  Type,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchArticle } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { isArticleSaved, toggleSavedArticle } from '@/lib/savedArticles';

const FONT_KEY = 'ratio.reader.fontSize';
const THEME_KEY = 'ratio.reader.theme';

function readPreference(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function CitationParagraph({ content, sources, isId, fontSize, textColor }) {
  const parts = String(content || '').split(/(\[\d+\])/g);
  return (
    <p
      className="reader-copy mb-6"
      style={{
        color: textColor,
        fontSize: fontSize + 'px',
        lineHeight: 1.82,
        letterSpacing: '0.002em',
      }}
    >
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return part;
        const number = Number(match[1]);
        if (number < 1 || number > sources.length) {
          return <sup key={index} className="ml-0.5 text-[11px] opacity-60">{part}</sup>;
        }
        return (
          <sup key={index} className="ml-0.5 align-super text-[11px] font-semibold">
            <a
              href={'#source-' + number}
              className="rounded px-0.5 text-[#52769A] underline decoration-[#52769A]/30 underline-offset-2"
              aria-label={(isId ? 'Lihat sumber ' : 'View source ') + number}
            >
              [{number}]
            </a>
          </sup>
        );
      })}
    </p>
  );
}

function formatDate(value, lang) {
  if (!value) return '';
  const raw = String(value);
  const normalized = raw.includes('T') || raw.endsWith('Z') ? raw : raw.replace(' ', 'T') + 'Z';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function IconButton({ label, onClick, active = false, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={
        'inline-flex h-10 w-10 items-center justify-center rounded-full transition ' +
        'hover:bg-black/[0.06] disabled:cursor-not-allowed disabled:opacity-35 ' +
        (active ? 'text-[#52769A]' : 'text-current')
      }
    >
      {children}
    </button>
  );
}

export default function ArticleDetail() {
  const { articleId } = useParams();
  const { lang } = useLanguage();
  const isId = lang !== 'en';
  const articleRef = useRef(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(() => isArticleSaved(articleId));
  const [fontSize, setFontSize] = useState(() => {
    const value = Number(readPreference(FONT_KEY, '18'));
    return Number.isFinite(value) ? Math.min(23, Math.max(16, value)) : 18;
  });
  const [readerTheme, setReaderTheme] = useState(() => readPreference(THEME_KEY, 'light') === 'dark' ? 'dark' : 'light');
  const [showTypeControls, setShowTypeControls] = useState(false);
  const [showContents, setShowContents] = useState(false);
  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    try { window.localStorage.setItem(FONT_KEY, String(fontSize)); } catch { /* keep this session's setting */ }
  }, [fontSize]);

  useEffect(() => {
    try { window.localStorage.setItem(THEME_KEY, readerTheme); } catch { /* keep this session's setting */ }
  }, [readerTheme]);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const root = document.documentElement;
        const max = root.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
      });
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [article, fontSize]);

  const sources = Array.isArray(article?.sources) ? article.sources : [];
  const blocks = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];
  const headings = useMemo(
    () => blocks.filter((block) => block.type === 'heading' && String(block.content || '').trim()),
    [blocks],
  );
  const dark = readerTheme === 'dark';
  const colors = dark
    ? { page: '#191B1F', surface: '#202329', text: '#F0EEE9', muted: '#A7A8A5', line: 'rgba(255,255,255,.12)', soft: '#252A31' }
    : { page: '#F7F6F2', surface: '#FDFCFA', text: '#252721', muted: '#777970', line: 'rgba(37,39,33,.13)', soft: '#EEECE5' };

  const handleBookmark = () => {
    if (!article) return;
    const result = toggleSavedArticle({ ...article, id: article.id || article.articleId || articleId });
    setSaved(result.saved);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: article?.title || 'Ratio', text: article?.summary || '', url });
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
        } catch { setShareCopied(false); }
      }
    }
  };

  const jumpToHeading = (index) => {
    document.getElementById('article-section-' + index)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowContents(false);
  };

  return (
    <div
      className="reader-page min-h-screen"
      style={{ background: colors.page, color: colors.text, transition: 'background .2s ease, color .2s ease' }}
    >
      <div className="fixed left-0 right-0 top-0 z-50 h-[3px]" style={{ background: colors.line }}>
        <div className="h-full bg-[#52769A] transition-[width] duration-150" style={{ width: progress + '%' }} />
      </div>

      <header
        className="sticky top-[3px] z-40 border-b backdrop-blur-xl"
        style={{ background: dark ? 'rgba(25,27,31,.92)' : 'rgba(247,246,242,.92)', borderColor: colors.line }}
      >
        <div className="mx-auto flex h-[62px] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/articles"
              aria-label={isId ? 'Kembali ke artikel' : 'Back to articles'}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-black/[0.06]"
            >
              <ArrowLeft className="h-[19px] w-[19px]" />
            </Link>
            <Link to="/" className="flex items-center gap-2" aria-label="Ratio home">
              <span className="font-display text-[18px] font-bold tracking-[-0.06em]">ratio.</span>
              <span className="hidden border-l pl-2 text-[10px] font-medium uppercase tracking-[0.16em] sm:inline" style={{ borderColor: colors.line, color: colors.muted }}>
                Reader
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="relative">
              <IconButton
                label={isId ? 'Pengaturan ukuran teks' : 'Text size settings'}
                active={showTypeControls}
                onClick={() => { setShowTypeControls((value) => !value); setShowContents(false); }}
              >
                <Type className="h-[18px] w-[18px]" />
              </IconButton>
              {showTypeControls && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border p-4 shadow-xl" style={{ background: colors.surface, borderColor: colors.line }}>
                  <p className="text-xs font-semibold" style={{ color: colors.muted }}>{isId ? 'Ukuran teks' : 'Text size'}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setFontSize((size) => Math.max(16, size - 1))}
                      disabled={fontSize <= 16}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30"
                      style={{ borderColor: colors.line }}
                      aria-label={isId ? 'Perkecil teks' : 'Decrease text size'}
                    >−</button>
                    <span className="text-sm font-semibold tabular-nums">{fontSize}px</span>
                    <button
                      type="button"
                      onClick={() => setFontSize((size) => Math.min(23, size + 1))}
                      disabled={fontSize >= 23}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30"
                      style={{ borderColor: colors.line }}
                      aria-label={isId ? 'Perbesar teks' : 'Increase text size'}
                    >+</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <IconButton
                label={isId ? 'Daftar isi' : 'Table of contents'}
                active={showContents}
                onClick={() => { setShowContents((value) => !value); setShowTypeControls(false); }}
                disabled={headings.length === 0}
              >
                <List className="h-[18px] w-[18px]" />
              </IconButton>
              {showContents && (
                <div className="absolute right-0 top-12 z-50 w-[min(300px,calc(100vw-32px))] rounded-2xl border p-3 shadow-xl" style={{ background: colors.surface, borderColor: colors.line }}>
                  <p className="px-2 py-1 text-xs font-semibold" style={{ color: colors.muted }}>{isId ? 'Di dalam artikel ini' : 'In this article'}</p>
                  <div className="mt-1 max-h-[55vh] overflow-y-auto">
                    {headings.map((heading, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => jumpToHeading(index)}
                        className="block w-full rounded-xl px-2 py-2.5 text-left text-sm leading-5 transition hover:bg-black/[0.05]"
                      >
                        {heading.content}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <IconButton
              label={dark ? (isId ? 'Gunakan tema terang' : 'Use light theme') : (isId ? 'Gunakan tema gelap' : 'Use dark theme')}
              onClick={() => setReaderTheme((value) => value === 'dark' ? 'light' : 'dark')}
            >
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </IconButton>
            <IconButton
              label={saved ? (isId ? 'Hapus dari tersimpan' : 'Remove bookmark') : (isId ? 'Simpan artikel' : 'Save article')}
              active={saved}
              onClick={handleBookmark}
              disabled={!article}
            >
              {saved ? <BookmarkCheck className="h-[18px] w-[18px]" /> : <Bookmark className="h-[18px] w-[18px]" />}
            </IconButton>
          </div>
        </div>
      </header>

      <main ref={articleRef} className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10 sm:px-9 sm:pt-[68px]">
        {loading && (
          <div className="animate-pulse space-y-5">
            <div className="h-3 w-32 rounded" style={{ background: colors.soft }} />
            <div className="h-12 w-11/12 rounded" style={{ background: colors.soft }} />
            <div className="h-5 w-2/3 rounded" style={{ background: colors.soft }} />
            <div className="mt-14 space-y-4">
              <div className="h-4 w-full rounded" style={{ background: colors.soft }} />
              <div className="h-4 w-full rounded" style={{ background: colors.soft }} />
              <div className="h-4 w-4/5 rounded" style={{ background: colors.soft }} />
            </div>
          </div>
        )}

        {!loading && failed && (
          <div className="py-20 text-center">
            <h1 className="font-display text-2xl font-semibold">{isId ? 'Artikel belum bisa dibuka.' : 'This article is unavailable.'}</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7" style={{ color: colors.muted }}>
              {isId ? 'Coba periksa koneksi internet, lalu muat ulang halaman ini.' : 'Check your internet connection, then reload this page.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full border px-5 py-2.5 text-sm font-semibold"
              style={{ borderColor: colors.line }}
            >
              {isId ? 'Muat ulang' : 'Reload'}
            </button>
          </div>
        )}

        {!loading && !failed && article && (
          <article>
            <div className="mb-9 sm:mb-12">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#52769A]">
                <span>{isId ? 'Pengetahuan' : 'Knowledge'}</span>
                <span className="opacity-50">/</span>
                <span>{article.id || articleId}</span>
              </div>

              <h1
                className="mt-5 text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.045em] sm:mt-6 sm:text-[3.45rem]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', textWrap: 'balance' }}
              >
                {article.title}
              </h1>

              {article.summary && (
                <p className="mt-5 max-w-[650px] text-[16px] leading-[1.8] sm:mt-6 sm:text-[18px]" style={{ color: colors.muted }}>
                  {article.summary}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium" style={{ color: colors.muted }}>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  {article.readingTimeMinutes || 1} {isId ? 'menit membaca' : 'min read'}
                </span>
                {formatDate(article.publishedAt, lang) && <span>{formatDate(article.publishedAt, lang)}</span>}
              </div>
            </div>

            {(article.coverImage || article.imageUrl || article.heroImage) && (
              <figure className="mb-10 overflow-hidden rounded-[5px] sm:mb-12">
                <img
                  src={article.coverImage || article.imageUrl || article.heroImage}
                  alt={article.title || ''}
                  className="aspect-[16/9] w-full object-cover"
                  loading="eager"
                />
              </figure>
            )}

            <div className="reader-content">
              {blocks.map((block, index) => {
                if (block.type === 'heading') {
                  const headingIndex = headings.findIndex((item) => item === block);
                  return (
                    <h2
                      id={'article-section-' + headingIndex}
                      key={index}
                      className="mb-5 mt-11 scroll-mt-28 text-[1.55rem] font-semibold leading-[1.25] tracking-[-0.035em] sm:mb-6 sm:mt-14 sm:text-[1.8rem]"
                      style={{ color: colors.text, fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
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
                      textColor={dark ? '#D8D8D2' : '#3F413B'}
                    />
                  );
                }
                return null;
              })}
            </div>

            <section className="mt-14 border-t pt-9 sm:mt-16 sm:pt-11" style={{ borderColor: colors.line }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#52769A]">
                {isId ? 'Untuk dibaca kembali' : 'Worth revisiting'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {isId ? 'Sampai di sini dulu.' : 'That’s the article.'}
              </h2>
              <p className="mt-2 text-sm leading-7" style={{ color: colors.muted }}>
                {isId ? 'Simpan artikel ini agar mudah ditemukan saat ingin membacanya lagi.' : 'Save this article so you can return to it whenever you like.'}
              </p>
              <button
                type="button"
                onClick={handleBookmark}
                className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:bg-black/[0.04]"
                style={{ borderColor: colors.line }}
              >
                {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {saved ? (isId ? 'Tersimpan' : 'Saved') : (isId ? 'Simpan artikel' : 'Save article')}
              </button>
            </section>

            <section id="sources" className="mt-14 border-t pt-9 sm:mt-16 sm:pt-11" style={{ borderColor: colors.line }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#52769A]">
                    {isId ? 'Bacaan lanjutan' : 'Further reading'}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {isId ? 'Sumber dan referensi' : 'Sources and references'}
                  </h2>
                </div>
                <span className="text-xs" style={{ color: colors.muted }}>{sources.length}</span>
              </div>

              {sources.length > 0 ? (
                <ol className="mt-6 space-y-0">
                  {sources.map((source, index) => (
                    <li
                      id={'source-' + (index + 1)}
                      key={source.source_url || index}
                      className="scroll-mt-28 border-b py-5 first:border-t"
                      style={{ borderColor: colors.line }}
                    >
                      <div className="flex gap-4">
                        <span className="pt-0.5 text-xs font-semibold tabular-nums" style={{ color: colors.muted }}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-6">{source.source_title}</p>
                          {source.citation_note && (
                            <p className="mt-1.5 text-xs leading-6" style={{ color: colors.muted }}>{source.citation_note}</p>
                          )}
                          {source.source_url && (
                            <a
                              href={source.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#52769A] hover:underline"
                            >
                              {isId ? 'Kunjungi sumber' : 'Visit source'}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-5 text-sm leading-7" style={{ color: colors.muted }}>
                  {isId ? 'Informasi sumber belum tersedia.' : 'Source information is not available.'}
                </p>
              )}
            </section>

            <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: colors.line }}>
              <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#52769A] hover:underline">
                <ArrowLeft className="h-4 w-4" />
                {isId ? 'Kembali ke artikel' : 'Back to articles'}
              </Link>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: colors.muted }}
              >
                {isId ? 'Ke atas' : 'Back to top'}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        )}
      </main>

      {shareCopied && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#252721] px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          <Check className="mr-2 inline h-3.5 w-3.5" />
          {isId ? 'Tautan artikel disalin' : 'Article link copied'}
        </div>
      )}
    </div>
  );
}
