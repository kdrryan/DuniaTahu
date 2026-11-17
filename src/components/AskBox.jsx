import { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const SUGGESTIONS = {
  id: [
    'Kenapa langit berwarna biru?',
    'Bagaimana gurita bisa ganti warna?',
    'Kenapa kita cegukan?',
    'Bagaimana piramida Giza dibangun?',
  ],
  en: [
    'Why is the sky blue?',
    'How do octopuses change color?',
    'Why do we get hiccups?',
    'How were the pyramids of Giza built?',
  ],
};

export default function AskBox({ onAsk, loading }) {
  const { lang, t } = useLanguage();
  const [value, setValue] = useState('');
  const suggestions = SUGGESTIONS[lang] || SUGGESTIONS.id;

  const submit = (event) => {
    event?.preventDefault();
    const question = value.trim();
    if (!question || loading) return;
    onAsk(question);
    setValue('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div className="glass-soft rounded-2xl p-2 transition-colors focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            maxLength={300}
            placeholder={t('ask.placeholder')}
            aria-label={t('ask.placeholder')}
            className="min-h-[88px] w-full resize-y bg-transparent px-3 py-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80"
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <span className="hidden text-[12px] text-muted-foreground sm:block">{t('ask.hint')}</span>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('ask.loading')}</>
              ) : (
                <>{t('ask.submit')} <ArrowUp className="h-4 w-4" strokeWidth={2.6} /></>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {lang === 'id' ? 'Coba tanyakan' : 'Try asking'}
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={loading}
              onClick={() => onAsk(suggestion)}
              className="rounded-full border border-border bg-background/70 px-3 py-2 text-[12px] font-medium leading-snug text-foreground/70 transition hover:border-blue-500/40 hover:bg-blue-500/[0.06] hover:text-foreground disabled:opacity-40"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
