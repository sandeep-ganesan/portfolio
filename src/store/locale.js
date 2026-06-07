import { atom } from 'nanostores';

const detectInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const desktop = document.getElementById('desktop-environment');
    if (desktop && desktop.dataset.ipLang === 'ja') {
      return 'ja';
    }
  }
  return 'en'; 
};

export const currentLang = atom(detectInitialLanguage());