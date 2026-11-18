import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clipboard, Copy, FileText, Loader2, Share2, Sparkles, X } from 'lucide-react';
import AnswerBody from '@/components/AnswerBody';
import { useLanguage } from '@/lib/LanguageContext';

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Copy unavailable');
}

export default function AnswerCard({ entry, loading }) {
  const { t } = useLanguage();
  const [showTextView, setShowTextView] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedCopied, setSelectedCopied] = useState(false);
  const textViewRef = useRef(null);
  const answerContentRef = useRef(null);

  if (loading) {
    return (
      <div className="glass rounded-3xl p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground/70">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('answer.loading')}
        </p>
        <div className="mt-4 space-y-2.5">
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-foreground/8" />
          <div className="h-3 w-full animate-pulse rounded-md bg-foreground/6" />
          <div className="h-3 w-11/12 animate-pulse rounded-md bg-foreground/6" />
          <div className="h-3 w-3/4 animate-pulse rounded-md bg-foreground/6" />
        </div>
      </div>
    );
  }

  if (!entry) return null;

  const completeAnswer = [
    entry.title,
    answerContentRef.current?.innerText?.trim() || entry.answer,
    entry.quick_facts?.length
      ? entry.quick_facts.map((fact, index) => `${index + 1}. ${fact}`).join('\n')
      : '',
  ].filter(Boolean).join('\n\n').trim();

  const captureSelection = () => {
    const selection = window.getSelection?.();
    const text = selection?.toString().trim();
    if (!text || !textViewRef.current || !selection.rangeCount) {
      setSelectedText('');
      return;
    }

    const range = selection.getRangeAt(0);
    if (!textViewRef.current.contains(range.commonAncestorContainer)) {
      setSelectedText('');
      return;
    }
    setSelectedText(text);
  };

  const handleCopyAll = async () => {
    try {
      await copyText(completeAnswer);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleCopySelected = async () => {
    if (!selectedText) return;
    try {
      await copyText(selectedText);
      setSelectedCopied(true);
    } catch {
      setSelectedCopied(false);
    }
  };

  const handleShareSelected = async () => {
    if (!selectedText) return;
    try {
      if (navigator.share) {
        await navigator.share({ text: selectedText });
      } else {
        await copyText(selectedText);
        setSelectedCopied(true);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        try {
          await copyText(selectedText);
          setSelectedCopied(true);
        } catch {
          setSelectedCopied(false);
        }
      }
    }
  };

  const openTextView = () => {
    setSelectedText('');
    setSelectedCopied(false);
    setShowTextView(true);
  };

  const closeTextView = () => {
    setShowTextView(false);
    setSelectedText('');
    setSelectedCopied(false);
    window.getSelection?.()?.removeAllRanges();
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass overflow-hidden rounded-3xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/8 px-4 py-2.5 sm:px-5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t('answer.new')}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? t('answer.copied') : t('answer.copyAll')}
            </button>
            <button
              type="button"
              onClick={openTextView}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 text-[11px] font-semibold text-foreground/80 transition hover:bg-foreground/10"
            >
              <FileText className="h-3.5 w-3.5" />
              {t('answer.selectText')}
            </button>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <p className="text-[12px] font-medium text-muted-foreground">{entry.question}</p>
          {entry.title && (
            <h2 className="mt-1.5 font-display text-fluid-title text-foreground">{entry.title}</h2>
          )}
          <div ref={answerContentRef} className="mt-3">
            <AnswerBody text={entry.answer} />
          </div>

          {entry.quick_facts?.length > 0 && (
            <div className="glass-soft mt-4 rounded-2xl p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <Sparkles className="h-3 w-3" /> {t('answer.quick')}
              </p>
              <ul className="mt-2 space-y-1.5">
                {entry.quick_facts.map((item, index) => (
                  <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-foreground/70">
                    <span className="font-semibold text-foreground/40">{index + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.article>

      {showTextView && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onClick={closeTextView}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t('answer.selectTextTitle')}
            className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl sm:max-h-[82vh] sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('answer.selectTextTitle')}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{t('answer.selectTextHint')}</p>
              </div>
              <button
                type="button"
                onClick={closeTextView}
                aria-label={t('dialog.close')}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedText && (
              <div className="flex shrink-0 items-center justify-end gap-1.5 border-b border-border bg-muted/50 px-3 py-2">
                <span className="mr-auto text-[11px] font-medium text-muted-foreground">{t('answer.textSelected')}</span>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleCopySelected}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-semibold text-foreground"
                >
                  {selectedCopied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                  {selectedCopied ? t('answer.copied') : t('answer.copySelected')}
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleShareSelected}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[11px] font-semibold text-foreground"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t('answer.shareSelected')}
                </button>
              </div>
            )}

            <div
              ref={textViewRef}
              className="ratio-selectable-text min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6"
              onMouseUp={captureSelection}
              onTouchEnd={() => window.setTimeout(captureSelection, 100)}
              onContextMenu={() => window.setTimeout(captureSelection, 100)}
            >
              {entry.title && (
                <h2 className="mb-4 font-display text-xl font-bold leading-snug text-foreground">
                  {entry.title}
                </h2>
              )}
              <div className="select-text">
                <AnswerBody text={entry.answer} />
                {entry.quick_facts?.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('answer.quick')}</p>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/80">
                      {entry.quick_facts.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
