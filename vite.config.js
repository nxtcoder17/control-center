import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
// import manifest from './manifest';
// import webExtension from "@samrum/vite-plugin-web-extension";

export default defineConfig({
  plugins: [
    solidPlugin(),
    // webExtension({
    //   manifest: manifest,
    // }),
  ],
  base: '/dist',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: 'public/background.html'
    },
  },
});
