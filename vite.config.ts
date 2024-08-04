import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import firefoxManifest from './manifest.firefox.json'
import chromeManifest from './manifest.chrome.json'
import webExtension from '@samrum/vite-plugin-web-extension'
import fs from 'fs-extra'
import path from 'path'
import { type InputPluginOption } from 'rollup'

function copyStaticFiles(options: StaticFileArg[]): InputPluginOption {
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

function isFirefox() {
	return process.env.VITE_BUILD_FOR_FIREFOX === 'true'
}

export default defineConfig({
	plugins: [
		solidPlugin(),
		webExtension({
			manifest: isFirefox() ? firefoxManifest : chromeManifest,
		}),
	],
	// base: '/dist',
	server: {
		port: 3000,
	},
	build: {
		target: 'esnext',
		outDir: isFirefox() ? process.env.VITE_BUILD_DIR_FIREFOX : process.env.VITE_BUILD_DIR_CHROME,
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
