import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

function formatDate(dateString, locale) {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function FunFactCard({ fact, loading, onExplain }) {
  const { locale, t } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="glass overflow-hidden rounded-3xl p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
            {t('fact.label')}
          </p>
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">
            {formatDate(fact?.date, locale)}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
          {loading ? '✨' : fact?.emoji || '✨'}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <div className="h-6 w-11/12 animate-pulse rounded-lg bg-foreground/8" />
          <div className="h-6 w-3/4 animate-pulse rounded-lg bg-foreground/6" />
          <div className="h-3 w-full animate-pulse rounded-md bg-foreground/5" />
          <div className="h-3 w-2/3 animate-pulse rounded-md bg-foreground/5" />
          <p className="flex items-center gap-2 pt-1 text-[12px] font-medium text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('fact.loading')}
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 max-w-2xl font-display text-fluid-hero text-foreground text-balance">
            {fact?.fact}
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-[1.8] text-muted-foreground sm:text-[15px]">
            {fact?.detail}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => onExplain?.(fact)}
              className="group inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t('fact.explain')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </>
      )}
    </motion.section>
  );
}
