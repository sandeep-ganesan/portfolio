import { atom } from 'nanostores';

export const openWindows = atom([]);

// Keep track of the highest z-index globally
let highestZIndex = 10;

// The element that opened each window (e.g. a desktop icon), so keyboard
// focus can go back to it when the window closes
const openers = new Map();

export function openWindow(id, title) {
  const current = openWindows.get();

  // If the window is already open, just bring it to the front!
  if (current.find(w => w.id === id)) {
    focusWindow(id);
    document.getElementById(`window-${id}`)?.focus({ preventScroll: true });
    return;
  }

  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
    openers.set(id, document.activeElement);
  }

  // Otherwise, open it and give it the newest, highest z-index
  highestZIndex++;
  openWindows.set([...current, { id, title, zIndex: highestZIndex }]);
}

export function closeWindow(id) {
  const remaining = openWindows.get().filter(w => w.id !== id);
  openWindows.set(remaining);

  // Return keyboard focus to whatever opened the window, or to the next window on top
  const opener = openers.get(id);
  openers.delete(id);
  if (opener && opener.isConnected && opener !== document.body) {
    opener.focus({ preventScroll: true });
  } else if (remaining.length > 0) {
    const top = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
    document.getElementById(`window-${top.id}`)?.focus({ preventScroll: true });
  }
}

export function closeTopWindow() {
  const current = openWindows.get();
  if (current.length === 0) return;
  const top = current.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
  closeWindow(top.id);
}

export function focusWindow(id) {
  highestZIndex++;

  // Find the window that was clicked and update its z-index
  openWindows.set(
    openWindows.get().map(w =>
      w.id === id ? { ...w, zIndex: highestZIndex } : w
    )
  );
}
