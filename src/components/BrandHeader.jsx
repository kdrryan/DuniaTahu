import ThemeToggle from '@/components/ThemeToggle';
import SettingsButton from '@/components/SettingsButton';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

function RatioLogo() {
  return (
    <>
      <img src="/brand/ratio-orbit-white-white-dot-dark-background.png" alt="Ratio" className="block h-9 w-10 shrink-0 object-contain dark:hidden" draggable="false" />
      <img src="/brand/ratio-orbit-black-black-dot-light-background.png" alt="Ratio" className="hidden h-9 w-10 shrink-0 object-contain dark:block" draggable="false" />
    </>
  );
}

export default function BrandHeader() {
  const { t } = useLanguage();
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <RatioLogo />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] leading-tight text-foreground">Ratio</p>
          <p className="truncate text-[10px] font-semibold tracking-[0.04em] text-muted-foreground">{t('header.tagline')}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to="/ratio#tanya" className="glass hidden h-9 items-center rounded-full px-3.5 text-[12.5px] font-semibold text-foreground/70 transition hover:text-foreground sm:inline-flex">
          {t('header.cta')}
        </Link>
        <SettingsButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
