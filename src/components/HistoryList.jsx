
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, History, Sparkles, Trash2, X } from 'lucide-react';
import AnswerBody from '@/components/AnswerBody';
import { useLanguage } from '@/lib/LanguageContext';

function formatTime(iso, locale) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryList({ items, onClear }) {
  const { locale, t } = useLanguage();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selected]);

  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-display text-[13.5px] text-foreground">
          <History className="h-3.5 w-3.5 text-foreground/45" /> {t('history.title')}
          <span className="rounded-full bg-foreground/8 px-1.5 py-0.5 text-[10.5px] font-semibold text-foreground/50">
            {items.length}
          </span>
        </p>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-foreground/6 hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" /> {t('history.clear')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-foreground/12 px-4 py-5 text-center text-[12.5px] leading-relaxed text-muted-foreground">
          {t('history.empty')}
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.slice(0, 12).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="glass-soft group flex w-full items-start gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:border-foreground/25"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-foreground/85">
                    {item.question}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                    {formatTime(item.created_at, locale)}
                  </span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/25 transition group-hover:text-foreground/60" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selected.question}
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="glass relative max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-t-3xl p-4 sm:rounded-3xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">
                  {formatTime(selected.created_at, locale)}
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={t('dialog.close')}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/6 text-foreground/60 transition hover:bg-foreground/12 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="mt-3 text-[12px] font-medium text-muted-foreground">{selected.question}</p>
              {selected.title && (
                <h2 className="mt-1.5 font-display text-fluid-title text-foreground">{selected.title}</h2>
              )}

              <div className="mt-3">
                <AnswerBody text={selected.answer} />
              </div>

              {selected.quick_facts?.length > 0 && (
                <div className="glass-soft mt-4 rounded-2xl p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <Sparkles className="h-3 w-3" /> {t('answer.quick')}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {selected.quick_facts.map((item, index) => (
                      <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-foreground/70">
                        <span className="font-semibold text-foreground/40">{index + 1}.</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>,
          document.body
        )}
    </section>
  );
}
