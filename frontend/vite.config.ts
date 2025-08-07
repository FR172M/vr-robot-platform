import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // <== Macht Vite im lokalen Netzwerk erreichbar!
    proxy: {
      '/api': 'http://localhost:3000', // <-- leitet alles mit /api an Express-Backend weiter
    },
  },
});
