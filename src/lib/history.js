const HISTORY_KEY = 'tanyadunia.history.v1';
const MAX_ITEMS = 60;

export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // penyimpanan penuh atau mode privat — riwayat tetap jalan di sesi ini
  }
}