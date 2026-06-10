**Portfolio**

A minimalist Astro-based portfolio application designed as an interactive, cozy, retro operating system desktop environment. The platform provides a playful yet highly optimized space to showcase software engineering work, projects, and personal background through a tactile, window-based interface.

### Features

* **Interactive Desktop Environment:** A fully functional web-based operating system featuring draggable windows, dynamic z-index layering, a responsive taskbar, and interactive desktop icons.
* **Bilingual Edge Localization:** Seamless, real-time translation between English and Japanese. The site uses server-side IP detection to serve the correct language instantly on load, while client-side stores allow zero-flicker toggling of UI text, tab titles, and SEO metadata.
* **Pixel-Perfect Aesthetic:** An authentic retro experience achieved through crisp hardware-level CSS image-rendering (`pixelated`), custom window border treatments, and the `DotGothic16` typeface.
* **Reactive Component State:** Complex UI interactions—like managing which windows are open, minimized, or focused—are handled cleanly via framework-agnostic atomic state stores, avoiding heavy React context wrappers.
* **Performant Island Architecture:** Built on Astro to deliver a static, lightning-fast baseline shell, hydrating only the specific interactive components (like the Window Manager or Clock) that require JavaScript.

### Tech Stack

* **Framework:** Astro (Static Site Generation / Islands Architecture)
* **UI Components:** React (Used strictly for complex interactive states)
* **Styling:** Tailwind CSS v4 (Modern Post-CSS Directives)
* **State Management:** Nanostores (Lightweight, framework-agnostic stores)
* **Typography:** Google Fonts (`DotGothic16`)