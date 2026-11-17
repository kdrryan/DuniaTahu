import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import AnswerBody from '@/components/AnswerBody';
import { useLanguage } from '@/lib/LanguageContext';

export default function AnswerCard({ entry, loading }) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="glass rounded-3xl p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground/75">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('answer.loading')}
        </p>
        <div className="mt-5 space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-foreground/8" />
          <div className="h-3 w-full animate-pulse rounded-md bg-foreground/6" />
          <div className="h-3 w-11/12 animate-pulse rounded-md bg-foreground/6" />
          <div className="h-3 w-3/4 animate-pulse rounded-md bg-foreground/6" />
        </div>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glass overflow-hidden rounded-3xl"
    >
      <div className="flex items-center gap-2 border-b border-border/70 px-5 py-3 sm:px-6">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {t('answer.new')}
        </span>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-[12px] font-medium leading-relaxed text-muted-foreground">{entry.question}</p>
        {entry.title && (
          <h2 className="mt-2 font-display text-fluid-title text-foreground">{entry.title}</h2>
        )}
        <div className="mt-5">
          <AnswerBody text={entry.answer} />
        </div>

        {entry.quick_facts?.length > 0 && (
          <div className="glass-soft mt-6 rounded-2xl p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" /> {t('answer.quick')}
            </p>
            <ul className="mt-3 space-y-2.5">
              {entry.quick_facts.map((item, index) => (
                <li key={index} className="flex gap-2.5 text-[13px] leading-[1.7] text-foreground/75">
                  <span className="font-semibold text-blue-500/80">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.article>
  );
}
