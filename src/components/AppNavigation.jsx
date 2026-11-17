import { Bookmark, Compass, House } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

function RatioMark() {
  return (
    <>
      <img
        src="/brand/ratio-orbit-black-white-dot-transparent.png"
        alt=""
        aria-hidden="true"
        className="block h-6 w-6 shrink-0 object-contain dark:hidden"
        draggable="false"
      />
      <img
        src="/brand/ratio-orbit-white-black-dot-transparent.png"
        alt=""
        aria-hidden="true"
        className="hidden h-6 w-6 shrink-0 object-contain dark:block"
        draggable="false"
      />
    </>
  );
}

function NavigationItem({ id, to, label, Icon, active, mobile = false }) {
  const icon = id === 'ratio'
    ? <RatioMark />
    : <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={active ? 2.25 : 1.8} />;

  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={[
        'flex items-center transition-colors',
        mobile
          ? 'h-14 justify-center rounded-xl'
          : 'h-12 w-full justify-start gap-4 rounded-full px-4 text-[15px]',
        active
          ? 'font-semibold text-foreground'
          : 'font-medium text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground',
        mobile && active ? 'bg-foreground/[0.035]' : '',
      ].join(' ')}
    >
      {icon}
      <span className={mobile ? 'sr-only' : 'truncate'}>{label}</span>
    </Link>
  );
}

export default function AppNavigation() {
  const { pathname, hash } = useLocation();
  const { t } = useLanguage();

  const destinations = [
    { id: 'home', to: '/', label: t('navigation.home'), Icon: House },
    { id: 'ratio', to: '/#tanya', label: t('navigation.ratio') },
    { id: 'explore', to: '/explore', label: t('navigation.explore'), Icon: Compass },
    { id: 'saved', to: '/saved', label: t('navigation.saved'), Icon: Bookmark },
  ];

  const isActive = (id) => {
    if (id === 'home') return pathname === '/' && hash !== '#tanya';
    if (id === 'ratio') return pathname === '/' && hash === '#tanya';
    if (id === 'explore') return pathname === '/explore';
    if (id === 'saved') return pathname === '/saved';
    return false;
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-border/75 bg-background lg:flex">
        <nav aria-label={t('navigation.main')} className="flex w-full flex-col gap-1 px-4 pt-8">
          {destinations.map((item) => (
            <NavigationItem
              key={item.id}
              {...item}
              active={isActive(item.id)}
            />
          ))}
        </nav>
      </aside>

      <nav
        aria-label={t('navigation.main')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 lg:hidden"
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-4 px-2">
          {destinations.map((item) => (
            <NavigationItem
              key={item.id}
              {...item}
              active={isActive(item.id)}
              mobile
            />
          ))}
        </div>
      </nav>
    </>
  );
}
