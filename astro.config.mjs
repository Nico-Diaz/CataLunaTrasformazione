// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  vite: {
    // Expone al navegador las variables SUPABASE_* (la anon key es pública por diseño).
    envPrefix: ['PUBLIC_', 'SUPABASE_'],
  },
});
