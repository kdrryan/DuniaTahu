
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

function formatDate(dateString, locale) {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function FunFactCard({ fact, loading, onExplain }) {
  const { locale, t } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass overflow-hidden rounded-3xl p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/6 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
          {t('fact.label')} · {formatDate(fact?.date, locale)}
        </span>

        <div className="animate-floaty flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground/6 text-xl">
          {loading ? '✨' : fact?.emoji || '✨'}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2.5">
          <div className="h-5 w-11/12 animate-pulse rounded-lg bg-foreground/8" />
          <div className="h-5 w-3/4 animate-pulse rounded-lg bg-foreground/6" />
          <div className="h-3 w-full animate-pulse rounded-md bg-foreground/5" />
          <div className="h-3 w-2/3 animate-pulse rounded-md bg-foreground/5" />
          <p className="flex items-center gap-2 pt-1 text-[12px] font-medium text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('fact.loading')}
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-3 font-display text-fluid-hero text-foreground text-balance">
            {fact?.fact}
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/60">{fact?.detail}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onExplain?.(fact)}
              className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {t('fact.explain')}
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </>
      )}
    </motion.section>
  );
}

