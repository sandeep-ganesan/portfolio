import { atom } from 'nanostores';

export const openWindows = atom([]);

// Keep track of the highest z-index globally
let highestZIndex = 10; 

export function openWindow(id, title) {
  const current = openWindows.get();
  
  // If the window is already open, just bring it to the front!
  if (current.find(w => w.id === id)) {
    focusWindow(id);
    return;
  }

  // Otherwise, open it and give it the newest, highest z-index
  highestZIndex++;
  openWindows.set([...current, { id, title, zIndex: highestZIndex }]);
}

export function closeWindow(id) {
  openWindows.set(openWindows.get().filter(w => w.id !== id));
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