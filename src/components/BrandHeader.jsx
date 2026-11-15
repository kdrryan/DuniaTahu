import { Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import SettingsButton from '@/components/SettingsButton';
import { useLanguage } from '@/lib/LanguageContext';

export default function BrandHeader() {
  const { t } = useLanguage();

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
          <Sparkles className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] leading-tight text-foreground">DuniaTahu</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('header.tagline')}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href="#tanya"
          className="glass hidden h-9 items-center rounded-full px-3.5 text-[12.5px] font-semibold text-foreground/70 transition hover:text-foreground sm:inline-flex"
        >
          {t('header.cta')}
        </a>
        <SettingsButton />
        <ThemeToggle />
      </div>
    </header>
  );
}