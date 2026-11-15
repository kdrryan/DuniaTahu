import ThemeToggle from '@/components/ThemeToggle';
import SettingsButton from '@/components/SettingsButton';
import { useLanguage } from '@/lib/LanguageContext';

function RatioMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className="h-5 w-5"
      fill="none"
    >
      <path
        d="M5.2 20.6C7.5 11.9 16.4 5.5 23.3 8.1c5.3 2 4.1 8.1-2.1 11.5-5.3 2.9-11.4 3.2-14.1.6-1.5-1.5-1.7-3.5-.8-5.5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="24.8" cy="6.8" r="2.6" fill="currentColor" />
    </svg>
  );
}

export default function BrandHeader() {
  const { t } = useLanguage();

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
          <RatioMark />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] leading-tight text-foreground">Ratio</p>
          <p className="truncate text-[10px] font-semibold tracking-[0.04em] text-muted-foreground">
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
