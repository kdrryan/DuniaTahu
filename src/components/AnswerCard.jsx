
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import AnswerBody from '@/components/AnswerBody';
import { useLanguage } from '@/lib/LanguageContext';

export default function AnswerCard({ entry, loading }) {
  const { t } = useLanguage();

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

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass overflow-hidden rounded-3xl"
    >
      <div className="flex items-center border-b border-foreground/8 px-4 py-2.5 sm:px-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t('answer.new')}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-[12px] font-medium text-muted-foreground">{entry.question}</p>
        {entry.title && (
          <h2 className="mt-1.5 font-display text-fluid-title text-foreground">{entry.title}</h2>
        )}
        <div className="mt-3">
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
  );
}
