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
    'navigation.main': 'Navigasi utama',
    'navigation.home': 'Beranda',
    'navigation.ratio': 'Ratio',
    'navigation.explore': 'Jelajahi',
    'navigation.saved': 'Tersimpan',
    'home.discover.eyebrow': 'RATIO / TEMUKAN',
    'home.discover.title': 'Temukan sesuatu yang baru.',
    'home.discover.subtitle': 'Wawasan kecil, perspektif yang lebih luas. Jelajahi pengetahuan yang layak untuk dipahami.',
    'home.discover.featured': 'Temuan pilihan',
    'home.discover.knowledgeArticle': 'Artikel pengetahuan',
    'home.discover.readingTime': 'menit baca',
    'home.discover.more': 'Lebih banyak untuk diketahui',
    'home.discover.moreSubtitle': 'Lanjutkan rasa ingin tahumu.',
    'home.discover.exploreAll': 'Jelajahi semua',
    'home.discover.goDeeper': 'Ingin tahu lebih jauh?',
    'home.discover.askTitle': 'Mulai dari satu pertanyaan.',
    'home.discover.askDescription': 'Minta Ratio menjelaskan hal yang membuatmu penasaran.',
    'home.discover.failed': 'Artikel belum dapat dimuat. Coba buka halaman ini kembali.',
    'home.discover.empty': 'Belum ada artikel yang tersedia.',
    'home.discover.emptyDescription': 'Artikel pengetahuan baru akan muncul di sini saat tersedia.',
    'saved.title': 'Tersimpan',
    'saved.subtitle': 'Kumpulan artikel yang ingin kamu baca kembali.',
    'saved.empty.title': 'Belum ada yang tersimpan',
    'saved.empty.description': 'Artikel yang kamu simpan nantinya akan muncul di halaman ini.',

    'header.tagline': 'Understand more.',
    'header.cta': 'Tanya Ratio',

    'fact.label': 'Ratio Daily',
    'fact.loading': 'Menyiapkan fakta hari ini…',
    'fact.explain': 'Ceritakan lebih dalam',

    'ask.placeholder': 'Tanya apa saja tentang cara dunia bekerja…',
    'ask.hint': 'Enter untuk kirim · Shift + Enter baris baru',
    'ask.submit': 'Tanya Ratio',
    'ask.loading': 'Menjawab…',

    'answer.loading': 'Ratio sedang menyiapkan jawaban…',
    'answer.new': 'Jawaban baru',
    'answer.quick': 'Fakta singkat',

    'history.title': 'Riwayatmu',
    'history.clear': 'Hapus',
    'history.empty': 'Belum ada riwayat. Tanyakan satu hal kecil yang bikin kamu penasaran hari ini.',
    'dialog.close': 'Tutup',

    'home.notice':
      'Riwayat tersimpan di perangkatmu sendiri — tidak perlu akun.',
    'home.footer': 'Ratio — satu wawasan baru setiap hari',
    'home.error.fact': 'Fakta hari ini belum bisa dimuat. Coba muat ulang halaman ya.',
    'home.error.answer': 'Jawabannya belum berhasil dibuat. Coba tanyakan lagi, ya.',
    'error.network': 'Koneksi internet terputus. Periksa koneksimu, lalu coba lagi.',
    'error.timeout': 'Prosesnya membutuhkan waktu lebih lama dari biasanya. Coba lagi, ya.',
    'error.service': 'Maaf, layanan Ratio sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
    'error.request': 'Pertanyaanmu belum dapat diproses. Coba periksa kembali pertanyaanmu.',
    'error.invalid_response': 'Maaf, jawaban belum dapat ditampilkan dengan baik. Silakan coba lagi.',
    'error.empty_response': 'Belum ada jawaban yang bisa ditampilkan. Coba tanyakan sekali lagi, ya.',
    'error.unknown': 'Maaf, terjadi kendala yang tidak terduga. Silakan coba lagi.',

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
    'navigation.main': 'Main navigation',
    'navigation.home': 'Home',
    'navigation.ratio': 'Ratio',
    'navigation.explore': 'Explore',
    'navigation.saved': 'Saved',
    'home.discover.eyebrow': 'RATIO / DISCOVER',
    'home.discover.title': 'Discover something new.',
    'home.discover.subtitle': 'Small discoveries. Bigger perspectives. Explore knowledge worth understanding.',
    'home.discover.featured': 'Featured discovery',
    'home.discover.knowledgeArticle': 'Knowledge article',
    'home.discover.readingTime': 'min read',
    'home.discover.more': 'More to discover',
    'home.discover.moreSubtitle': 'Keep following your curiosity.',
    'home.discover.exploreAll': 'Explore all',
    'home.discover.goDeeper': 'Go deeper',
    'home.discover.askTitle': 'Start with one question.',
    'home.discover.askDescription': 'Ask Ratio to explain something you are curious about.',
    'home.discover.failed': 'Articles could not be loaded. Please try this page again.',
    'home.discover.empty': 'No articles are available yet.',
    'home.discover.emptyDescription': 'New knowledge articles will appear here when available.',
    'saved.title': 'Saved',
    'saved.subtitle': 'A collection of articles you want to revisit.',
    'saved.empty.title': 'Nothing saved yet',
    'saved.empty.description': 'Articles you save will appear on this page.',

    'header.tagline': 'Understand more.',
    'header.cta': 'Ask Ratio',

    'fact.label': 'Ratio Daily',
    'fact.loading': 'Preparing today’s fact…',
    'fact.explain': 'Tell me more',

    'ask.placeholder': 'Ask anything about how the world works…',
    'ask.hint': 'Enter to send · Shift + Enter for a new line',
    'ask.submit': 'Ask Ratio',
    'ask.loading': 'Answering…',

    'answer.loading': 'Ratio is preparing an answer…',
    'answer.new': 'New answer',
    'answer.quick': 'Quick facts',

    'history.title': 'Your history',
    'history.clear': 'Clear',
    'history.empty': 'No history yet. Ask one small thing that made you curious today.',
    'dialog.close': 'Close',

    'home.notice':
      'Your history is stored on your own device — no account needed.',
    'home.footer': 'Ratio — one new insight every day',
    'home.error.fact': 'Today’s fact could not be loaded. Try reloading the page.',
    'home.error.answer': 'The answer could not be generated. Please try asking again.',
    'error.network': 'Your internet connection seems to be unavailable. Please check your connection and try again.',
    'error.timeout': 'This is taking longer than expected. Please try again.',
    'error.service': 'Sorry, Ratio is temporarily experiencing difficulties. Please try again shortly.',
    'error.request': 'Your question could not be processed. Please check it and try again.',
    'error.invalid_response': 'Sorry, the answer could not be displayed properly. Please try again.',
    'error.empty_response': 'There is no answer to display yet. Please try asking again.',
    'error.unknown': 'Sorry, something unexpected happened. Please try again.',

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
