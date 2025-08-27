import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { getAppConfig } from '@/lib/env';
import globalCss from '@/styles/globals.css';
import EmbedFixedAgentClient from './agent-client';

const wrapper = document.createElement('div');
wrapper.setAttribute('id', 'lk-embed-wrapper');
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

const reactRoot = document.createElement('div');
shadowRoot.appendChild(reactRoot);

getAppConfig(window.location.origin)
  .then((appConfig) => {
    const root = ReactDOM.createRoot(reactRoot);
    root.render(<EmbedFixedAgentClient appConfig={appConfig} />);
  })
  .catch((err) => {
    console.error('Error loading livekit embed-popup app config:', err);
  });
