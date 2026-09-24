import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, 'public');

// Ensure root images are copied to public directory for reliable static serving
['logofront.png', 'Shreya_3dmodel.png', 'Shreya_Front.png'].forEach(file => {
  const src = path.resolve(__dirname, file);
  const dest = path.resolve(publicDir, file);
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  } catch (err) {
    console.error(`Failed to copy ${file}:`, err);
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: true
  }
});
