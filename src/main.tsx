
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Feature flag: set VITE_APP_VERSION=v2 to load the new architecture
const V2 = import.meta.env.VITE_APP_VERSION === 'v2';

async function bootstrap() {
  if (V2) {
    const { default: AppV2 } = await import('./AppV2.tsx');
    createRoot(document.getElementById('root')!).render(<AppV2 />);
  } else {
    const { default: App } = await import('./App.tsx');
    // Remove dark mode class addition
    createRoot(document.getElementById('root')!).render(<App />);
  }
}

bootstrap();
