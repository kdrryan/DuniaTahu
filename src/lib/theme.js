const THEME_KEY = 'tanyadunia.theme.v1';

const THEME_FAVICONS = {
  // Per Ratio's brand direction: light theme uses the white mark on black.
  light: '/brand/ratio-orbit-white-white-dot-dark-background.png',
  // Dark theme uses the black mark on white.
  dark: '/brand/ratio-orbit-black-black-dot-light-background.png',
};

function updateThemeFavicon(theme) {
  const favicon = document.querySelector('link[rel="icon"]');
  const src = THEME_FAVICONS[theme] || THEME_FAVICONS.light;

  if (favicon) {
    favicon.type = 'image/png';
    favicon.href = src;
  }
}

export function getTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  updateThemeFavicon(theme);
}

export function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // mode privat — tema tetap berlaku di sesi ini
  }
}
