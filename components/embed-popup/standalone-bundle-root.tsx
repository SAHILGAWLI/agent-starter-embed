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

type Appearance = 'default' | 'pure';

function getAppearance(): Appearance {
  const script = getLoaderScript();
  const a = (script?.dataset?.appearance || '').toLowerCase();
  return a === 'pure' ? 'pure' : 'default';
}

function applyAppearance(appearance: Appearance, root: ShadowRoot) {
  if (appearance !== 'pure') return;
  const style = document.createElement('style');
  style.textContent = `
    .light {
      --bg1: #ffffff;
      --bg2: #fafafa;
      --bg3: #f2f2f2;
      --bgAccentPrimary: #f5f5f5;
      --separator1: #e5e5e5;
      --separator2: #dddddd;
      /* Stronger text contrast in pure light */
      --foreground: oklch(0.18 0 0);          /* ~#2e2e2e */
      --muted-foreground: oklch(0.42 0 0);    /* ~#6b6b6b */
      --background: oklch(1 0 0);
      --card: oklch(1 0 0);
      --popover: oklch(1 0 0);
      --border: oklch(0.92 0 0);
      --input: oklch(0.92 0 0);
    }
  `;
  root.appendChild(style);
}

// A container inside the shadow DOM whose classList we control for theming
const themeRoot = document.createElement('div');
// Set base text color within the shadow tree so it doesn't inherit host page
// foreground (fixes dark popup on light host and vice-versa)
themeRoot.style.color = 'var(--foreground)';
themeRoot.style.background = 'transparent';
shadowRoot.appendChild(themeRoot);

const reactRoot = document.createElement('div');
themeRoot.appendChild(reactRoot);

// Expose the shadow root so internal components (e.g., dropdown portals)
// can render within the same stacking/scrolling context when embedded.
// This is scoped to the host page window and is safe for multiple embeds
// as each script execution has its own closure; the last one wins for its own widget.
window.__LK_EMBED_SHADOW_ROOT = shadowRoot;

// Create a dedicated HTMLElement inside the shadow tree for portals.
// Radix Portal expects an HTMLElement container (not a ShadowRoot).
const portalRoot = document.createElement('div');
themeRoot.appendChild(portalRoot);
(window as Window).__LK_EMBED_PORTAL_EL = portalRoot;

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
  // 1) The executing script (most reliable in prod)
  const cs = (document.currentScript as HTMLScriptElement | null) ?? undefined;
  if (cs && (cs.src?.includes('embed-popup.js') || cs.dataset?.theme)) {
    return cs;
  }
  // 2) Any script whose src includes our bundle name
  const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
  const bySrc = scripts.find((s) => s.src.includes('embed-popup.js'));
  if (bySrc) return bySrc;
  // 3) Any script with data-theme set
  const byData = scripts.find((s) => !!s.dataset?.theme);
  return byData;
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
    rootEl.style.colorScheme = 'dark';
  } else if (pref === 'light') {
    rootEl.classList.add('light');
    rootEl.style.colorScheme = 'light';
  } else {
    // system default
    setFromSystem();
    rootEl.style.colorScheme = systemDark?.matches ? 'dark' : 'light';
    // keep synced if system changes
    if (systemDark && 'addEventListener' in systemDark) {
      systemDark.addEventListener('change', setFromSystem);
    }
  }
}

// Determine the requested theme and appearance, then apply within the shadow DOM
applyTheme(getRequestedTheme() ?? 'system', themeRoot);
applyAppearance(getAppearance(), shadowRoot);

getAppConfig(getScriptOrigin())
  .then((appConfig) => {
    const root = ReactDOM.createRoot(reactRoot);
    root.render(<EmbedFixedAgentClient appConfig={appConfig} />);
  })
  .catch((err) => {
    console.error('Error loading livekit embed-popup app config:', err);
  });
// EOF
