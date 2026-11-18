import ThemeToggle from '@/components/ThemeToggle';
import SettingsButton from '@/components/SettingsButton';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'react-router-dom';

export default function BrandHeader() {
  const { t } = useLanguage();

  return (
    <header className="flex items-center justify-between gap-3">
      <Link
        to="/"
        aria-label="Ratio home"
        className="min-w-0 font-display text-[24px] font-bold leading-none tracking-[-0.06em] text-foreground sm:text-[26px]"
      >
        ratio.
      </Link>

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
