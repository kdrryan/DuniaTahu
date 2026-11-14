export const LANGUAGES = ['id', 'en'];

export const LANGUAGE_LABELS = {
  id: 'Bahasa Indonesia',
  en: 'English',
};

export const LANGUAGE_LOCALES = {
  id: 'id-ID',
  en: 'en-US',
};

const STRINGS = {
  id: {
    'header.tagline': 'Rasa penasaran harian',
    'header.cta': 'Mulai bertanya',

    'fact.label': 'Fakta hari ini',
    'fact.loading': 'Menyiapkan fakta hari ini…',
    'fact.explain': 'Ceritakan lebih dalam',

    'ask.placeholder': 'Tanya apa saja tentang cara dunia bekerja…',
    'ask.hint': 'Enter untuk kirim · Shift + Enter baris baru',
    'ask.submit': 'Tanya',
    'ask.loading': 'Menjawab…',

    'answer.loading': 'Dunia sedang mengetik jawaban…',
    'answer.new': 'Jawaban baru',
    'answer.quick': 'Fakta singkat',

    'history.title': 'Riwayatmu',
    'history.clear': 'Hapus',
    'history.empty': 'Belum ada riwayat. Tanyakan satu hal kecil yang bikin kamu penasaran hari ini.',
    'dialog.close': 'Tutup',

    'home.notice':
      'Riwayat tersimpan di perangkatmu sendiri — tidak perlu akun, dan tidak dikirim ke mana pun selain mesin AI yang menjawab.',
    'home.footer': 'Tanya Dunia — satu fakta baru setiap hari',
    'home.error.fact': 'Fakta hari ini belum bisa dimuat. Coba muat ulang halaman ya.',
    'home.error.answer': 'Jawabannya belum berhasil dibuat. Coba tanyakan lagi, ya.',
    'home.explain': 'Ceritakan lebih dalam soal fakta ini:',

    'settings.open': 'Pengaturan',
    'settings.title': 'Pengaturan',
    'settings.language': 'Bahasa',
    'settings.close': 'Tutup',

    'theme.toLight': 'Pakai tema terang',
    'theme.toDark': 'Pakai tema gelap',

    'cat.semua': 'Semua',
    'cat.sains': 'Sains',
    'cat.sejarah': 'Sejarah',
    'cat.alam': 'Alam',
    'cat.teknologi': 'Teknologi',
    'cat.tubuh': 'Tubuh',
    'cat.angkasa': 'Luar Angkasa',
  },
  en: {
    'header.tagline': 'Daily curiosity',
    'header.cta': 'Start asking',

    'fact.label': 'Fact of the day',
    'fact.loading': 'Preparing today’s fact…',
    'fact.explain': 'Tell me more',

    'ask.placeholder': 'Ask anything about how the world works…',
    'ask.hint': 'Enter to send · Shift + Enter for a new line',
    'ask.submit': 'Ask',
    'ask.loading': 'Answering…',

    'answer.loading': 'The world is typing an answer…',
    'answer.new': 'New answer',
    'answer.quick': 'Quick facts',

    'history.title': 'Your history',
    'history.clear': 'Clear',
    'history.empty': 'No history yet. Ask one small thing that made you curious today.',
    'dialog.close': 'Close',

    'home.notice':
      'Your history is stored on your own device — no account needed, and nothing is sent anywhere except to the AI engine that answers.',
    'home.footer': 'Tanya Dunia — one new fact every day',
    'home.error.fact': 'Today’s fact could not be loaded. Try reloading the page.',
    'home.error.answer': 'The answer could not be generated. Please try asking again.',
    'home.explain': 'Tell me more about this fact:',

    'settings.open': 'Settings',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.close': 'Close',

    'theme.toLight': 'Use light theme',
    'theme.toDark': 'Use dark theme',

    'cat.semua': 'All',
    'cat.sains': 'Science',
    'cat.sejarah': 'History',
    'cat.alam': 'Nature',
    'cat.teknologi': 'Technology',
    'cat.tubuh': 'Body',
    'cat.angkasa': 'Space',
  },
};

export function translate(lang, key) {
  const table = STRINGS[lang] || STRINGS.id;
  return table[key] ?? STRINGS.id[key] ?? key;
}

export function categoryLabel(lang, id) {
  return translate(lang, `cat.${id}`);
}