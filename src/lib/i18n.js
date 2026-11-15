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
    'header.tagline': 'oleh @kdrryann',
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
      'Riwayat tersimpan di perangkatmu sendiri — tidak perlu akun.',
    'home.footer': 'DuniaTahu — satu fakta baru setiap hari',
    'home.error.fact': 'Fakta hari ini belum bisa dimuat. Coba muat ulang halaman ya.',
    'home.error.answer': 'Jawabannya belum berhasil dibuat. Coba tanyakan lagi, ya.',
    'error.network': 'Koneksi internet terputus. Periksa koneksimu, lalu coba lagi.',
    'error.timeout': 'Prosesnya membutuhkan waktu lebih lama dari biasanya. Coba lagi, ya.',
    'error.service': 'Maaf, layanan DuniaTahu sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
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
    'header.tagline': 'by @kdrryann',
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
      'Your history is stored on your own device — no account needed.',
    'home.footer': 'DuniaTahu — one new fact every day',
    'home.error.fact': 'Today’s fact could not be loaded. Try reloading the page.',
    'home.error.answer': 'The answer could not be generated. Please try asking again.',
    'error.network': 'Your internet connection seems to be unavailable. Please check your connection and try again.',
    'error.timeout': 'This is taking longer than expected. Please try again.',
    'error.service': 'Sorry, DuniaTahu is temporarily experiencing difficulties. Please try again shortly.',
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
