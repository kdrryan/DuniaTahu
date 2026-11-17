import { Compass, Sparkles } from 'lucide-react';
import BrandHeader from '@/components/BrandHeader';
import { useLanguage } from '@/lib/LanguageContext';

export default function Explore() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:px-8 lg:pb-16">
        <BrandHeader />

        <main className="mt-9 space-y-7 sm:mt-11">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Compass className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                {t('navigation.explore')}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t('explore.title')}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              {t('explore.subtitle')}
            </p>
          </div>

          <section className="glass flex min-h-[250px] flex-col items-center justify-center rounded-3xl px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/[0.045] text-foreground/70">
              <Sparkles className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h2 className="mt-4 font-display text-base font-semibold text-foreground">
              {t('explore.empty.title')}
            </h2>
            <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
              {t('explore.empty.description')}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
