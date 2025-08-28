import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { getAppConfig } from '@/lib/env';
import globalCss from '@/styles/globals.css';
import EmbedFixedAgentClient from './agent-client';

const wrapper = document.createElement('div');
wrapper.setAttribute('id', 'lk-embed-wrapper');
// Ensure the shadow host sits above the host page and spans the viewport.
// We keep pointer-events disabled at the host so inner overlay/panel can selectively enable it.
wrapper.style.position = 'fixed';
wrapper.style.inset = '0';
wrapper.style.zIndex = '2147483647';
// Allow the shadow subtree to receive clicks (Trigger must be clickable when closed)
wrapper.style.pointerEvents = 'auto';
document.body.appendChild(wrapper);

// Use a shadow root so that any relevant css classes don't leak out and effect the broader page
const shadowRoot = wrapper.attachShadow({ mode: 'open' });

// Include all app styles into the shadow root
// FIXME: this includes styles for the welcome page / etc, not just the popup embed!
const styleTag = document.createElement('style');
styleTag.textContent = globalCss;
shadowRoot.appendChild(styleTag);

// Override the primary color palette for the popup only (scoped to the shadow root)
// Adjust the shades below if you want a different orange.
const colorOverrides = document.createElement('style');
colorOverrides.textContent = `
:root {
  /* Yellow theme */
  --primary: #facc15;       /* yellow-400 */
  --primary-hover: #eab308; /* yellow-500 */
  --fgAccent: #facc15;      /* drives trigger circle */
  --bgAccentPrimary: color-mix(in oklab, #facc15 20%, white 80%);
}
.dark {
  --primary: #facc15;
  --primary-hover: #eab308;
  --fgAccent: #facc15;
  --bgAccentPrimary: color-mix(in oklab, #facc15 25%, black 75%);
}
`;
shadowRoot.appendChild(colorOverrides);

// A container inside the shadow DOM whose classList we control for theming
const themeRoot = document.createElement('div');
shadowRoot.appendChild(themeRoot);

const reactRoot = document.createElement('div');
themeRoot.appendChild(reactRoot);

// Expose the shadow root so internal components (e.g., dropdown portals)
// can render within the same stacking/scrolling context when embedded.
// This is scoped to the host page window and is safe for multiple embeds
// as each script execution has its own closure; the last one wins for its own widget.
window.__LK_EMBED_SHADOW_ROOT = shadowRoot;

// Determine origin from the script that loaded this bundle so config resolves correctly when embedded
function getScriptOrigin(): string {
  try {
    const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
    const found = scripts.find((s) => s.src.includes('embed-popup.js'));
    if (found && found.src) {
      return new URL(found.src).origin;
    }
  } catch {}
  return window.location.origin;
}

// Locate the script element that loaded this bundle so we can read attributes like data-theme
function getLoaderScript(): HTMLScriptElement | undefined {
  const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
  return scripts.find((s) => s.src.includes('embed-popup.js'));
}

type ThemePref = 'dark' | 'light' | 'system';

function getRequestedTheme(): ThemePref | undefined {
  const script = getLoaderScript();
  try {
    // 1) data-theme attribute wins
    const dataAttr = (script?.dataset?.theme || '').toLowerCase();
    if (dataAttr === 'dark' || dataAttr === 'light' || dataAttr === 'system') {
      return dataAttr as ThemePref;
    }

    // 2) ?theme= query param
    if (script?.src) {
      const url = new URL(script.src);
      const q = (url.searchParams.get('theme') || '').toLowerCase();
      if (q === 'dark' || q === 'light' || q === 'system') {
        return q as ThemePref;
      }
    }
  } catch {}
  // 3) no explicit preference
  return undefined;
}

function applyTheme(pref: ThemePref | undefined, rootEl: HTMLElement) {
  // Remove both to reset
  rootEl.classList.remove('dark');
  rootEl.classList.remove('light');

  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

  function setFromSystem() {
    rootEl.classList.toggle('dark', !!systemDark?.matches);
    rootEl.classList.toggle('light', !systemDark?.matches);
  }

  if (pref === 'dark') {
    rootEl.classList.add('dark');
  } else if (pref === 'light') {
    rootEl.classList.add('light');
  } else {
    // system default
    setFromSystem();
    // keep synced if system changes
    if (systemDark && 'addEventListener' in systemDark) {
      systemDark.addEventListener('change', setFromSystem);
    }
  }
}

// Determine the requested theme and apply it within the shadow DOM
applyTheme(getRequestedTheme() ?? 'system', themeRoot);

getAppConfig(getScriptOrigin())
  .then((appConfig) => {
    const root = ReactDOM.createRoot(reactRoot);
    root.render(<EmbedFixedAgentClient appConfig={appConfig} />);
  })
  .catch((err) => {
    console.error('Error loading livekit embed-popup app config:', err);
  });
// EOF
