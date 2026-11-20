import { atom } from 'nanostores';

const STORAGE_KEY = 'lang';

const readSavedLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'ja' ? saved : null;
  } catch {
    return null;
  }
};

const detectInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    // A language the visitor picked before wins over the IP-based guess
    const saved = readSavedLanguage();
    if (saved) return saved;

    const desktop = document.getElementById('desktop-environment');
    if (desktop && desktop.dataset.ipLang === 'ja') {
      return 'ja';
    }
  }
  return 'en';
};

export const currentLang = atom(detectInitialLanguage());

// Only called when the visitor explicitly switches language,
// so the IP-based default is never saved as if it were a choice
export function setLanguage(lang) {
  currentLang.set(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage blocked (private mode etc.) – the switch still works for this visit
  }
}

// Keep <html lang> in sync so browsers and screen readers treat the text correctly
if (typeof document !== 'undefined') {
  currentLang.subscribe((lang) => {
    document.documentElement.lang = lang;
  });
}
