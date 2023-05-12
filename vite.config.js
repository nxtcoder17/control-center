import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import manifest from './manifest.firefox.json';
import webExtension from "@samrum/vite-plugin-web-extension";
import fs from 'fs-extra';
import path from "path";
import assert from 'assert';

function copyStaticFiles(options) {
  // console.log("options: ", options)
  return {
    name: "sdfasdf",
    writeBundle: {
      // sequential: true,
      order: 'post',
      handler: async (args) => {
        options.map(async (entry) => {
          if (typeof entry === "string") {
            const rDir = path.join(args.dir, entry)
            await fs.mkdirp(rDir)
            console.log(`copying [${entry}] to [${path.relative(path.dirname(args.dir), rDir)}]`)
            return fs.copy(entry, rDir)
          }

          if (typeof entry === "object") {
            assert(entry?.from != "", "'from' key must be present")
            assert(entry?.to != "", "'to' key must be present")
            let rDir = path.join(args.dir, entry.to)
            const stat = await fs.lstat(entry.from)
            if (stat.isDirectory()) {
              rDir = path.join(args.dir, entry.to)
              await fs.mkdirp(rDir)
            }
            console.log(`copying [${entry.from}] to [${path.relative(path.dirname(args.dir), rDir)}]`)
            return fs.copy(entry.from, rDir)
          }

          throw new Error("invalid entry, must be a string or object like {from: '', to: ''}")
        })
        // console.log(args)
      },
    },
  };
}

export default defineConfig({
  plugins: [
    solidPlugin(),
    webExtension({
      manifest: manifest,
    }),
  ],
  // base: '/dist',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      treeshake: true,
      input: 'src/background.html',
      plugins: [
        copyStaticFiles([
          { from: "./icons", to: "./icons" },
          // { from: "./manifest.firefox.json", to: "./manifest.json" },
        ]),
      ],
    },
  },
});
