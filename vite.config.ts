import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import manifest from './manifest.firefox.json'
import webExtension from '@samrum/vite-plugin-web-extension'
import fs from 'fs-extra'
import path from 'path'
import { type InputPluginOption } from 'rollup'

function copyStaticFiles (options: StaticFileArg[]): InputPluginOption {
  return {
    name: 'copy-static-files',
    writeBundle: {
      // sequential: true,
      order: 'post',
      handler: async (args) => {
        options.map(async (entry) => {
          if (args.dir == null) {
            throw new Error('args.dir is not defined')
          }
          let rDir = path.join(args.dir, entry.to)
          const stat = await fs.lstat(entry.from)
          if (stat.isDirectory()) {
            rDir = path.join(args.dir, entry.to)
            await fs.mkdirp(rDir)
          }
          console.log(`copying [${entry.from}] to [${path.relative(path.dirname(args.dir), rDir)}]`)
          await fs.copy(entry.from, rDir)
        })
      },
    },
  }
}

interface StaticFileArg {
  from: string
  to: string
}

export default defineConfig({
  plugins: [
    solidPlugin(),
    webExtension({
      manifest,
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
          { from: './icons', to: './icons' },
          // { from: "./manifest.firefox.json", to: "./manifest.json" },
        ]),
      ],
    },
  },
})
