import { Bookmark, Compass, House, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';

function RatioMark() {
  return (
    <>
      <img src="/brand/ratio-orbit-black-black-dot-light-background.png" alt="" aria-hidden="true" className="block h-6 w-6 shrink-0 rounded-md object-contain dark:hidden" draggable="false" />
      <img src="/brand/ratio-orbit-white-white-dot-dark-background.png" alt="" aria-hidden="true" className="hidden h-6 w-6 shrink-0 rounded-md object-contain dark:block" draggable="false" />
    </>
  );
}

function NavigationItem({ id, to, label, Icon, active, mobile = false }) {
  const icon = id === 'ratio' ? <RatioMark /> : <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={active ? 2.25 : 1.8} />;
  return (
    <Link to={to} aria-label={label} aria-current={active ? 'page' : undefined} title={label}
      className={[
        'flex items-center transition-colors',
        mobile ? 'h-14 justify-center rounded-xl' : 'h-12 w-full justify-start gap-4 rounded-full px-4 text-[15px]',
        active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground',
        mobile && active ? 'bg-foreground/[0.035]' : '',
      ].join(' ')}>
      {icon}
      <span className={mobile ? 'sr-only' : 'truncate'}>{label}</span>
    </Link>
  );
}

export default function AppNavigation({ sidebarCollapsed, onToggleSidebar }) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const destinations = [
    { id: 'home', to: '/', label: t('navigation.home'), Icon: House },
    { id: 'ratio', to: '/ratio#tanya', label: t('navigation.ratio') },
    { id: 'explore', to: '/explore', label: t('navigation.explore'), Icon: Compass },
    { id: 'saved', to: '/saved', label: t('navigation.saved'), Icon: Bookmark },
  ];
  const isActive = (id) => {
    if (id === 'home') return pathname === '/';
    if (id === 'ratio') return pathname === '/ratio';
    if (id === 'explore') return pathname === '/explore' || pathname.startsWith('/articles');
    if (id === 'saved') return pathname === '/saved';
    return false;
  };

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-border/75 bg-background transition-[width] duration-200 md:flex ${sidebarCollapsed ? 'w-14' : 'w-[232px]'}`}>
        {sidebarCollapsed ? (
          <div className="flex w-full justify-center pt-5">
            <button type="button" onClick={onToggleSidebar} aria-label="Open sidebar" title="Open sidebar" className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground">
              <PanelLeftOpen className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col px-4 pt-5">
            <div className="mb-3 flex h-10 items-center justify-end">
              <button type="button" onClick={onToggleSidebar} aria-label="Collapse sidebar" title="Collapse sidebar" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground">
                <PanelLeftClose className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>
            <nav aria-label={t('navigation.main')} className="flex flex-col gap-1">
              {destinations.map((item) => <NavigationItem key={item.id} {...item} active={isActive(item.id)} />)}
            </nav>
          </div>
        )}
      </aside>
      <nav aria-label={t('navigation.main')} className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 md:hidden">
        <div className="mx-auto grid h-14 max-w-md grid-cols-4 px-2">
          {destinations.map((item) => <NavigationItem key={item.id} {...item} active={isActive(item.id)} mobile />)}
        </div>
      </nav>
    </>
  );
}
