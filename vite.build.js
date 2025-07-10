import { build } from "rolldown-vite";
import path from "node:path";
import solidjs from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { globSync } from "node:fs";
import fs from "node:fs/promises";

function isFirefox() {
	return process.env.VITE_BUILD_FOR_FIREFOX === "true";
}

const contentRootDir = "src";
const outDir = `.dist/${isFirefox() ? "firefox" : "chrome"}`;

await Promise.all(
	globSync("src/content-scripts/**/*.{js,ts}").map((item) => {
		return build({
			build: {
				target: "es2017",
				outDir: outDir,
				modulePreload: {
					polyfill: false,
				},
				emptyOutDir: false,
				rollupOptions: {
					// external: ["webextension-polyfill"],
					input: {
						[path.relative(
							"src",
							item.slice(0, item.length - path.extname(item).length),
						)]: path.resolve(item),
					},
					output: {
						// globals: {
						// 	"webextension-polyfill": isFirefox() ? "browser" : "chrome",
						// },
						format: "iife",
						entryFileNames: "[name].js",
					},
				},
			},
		});
	}),
);

function inputBuilder(...files) {
	return Object.fromEntries(
		files.map((f) => [
			path.relative(
				contentRootDir,
				f.slice(0, f.length - path.extname(f).length),
			),
			f,
			f.slice(0, f.length - path.extname(f).length),
			path.resolve(contentRootDir, f),
		]),
	);
}

const htmlFiles = ["src/app/index.html", "src/option/index.html"];

// 🧱 Build 2: Other Scripts
await build({
	debug: true,
	// root: "./src",
	plugins: [solidjs(), tailwindcss()],
	build: {
		target: "esnext",
		outDir: outDir,
		emptyOutDir: false,
		modulePreload: {
			polyfill: false,
		},
		rollupOptions: {
			input: inputBuilder("src/background/index.ts", ...htmlFiles),
			output: {
				entryFileNames: "[name].js",
			},
		},
	},
});

// Step 3: move src/app/index.html src/option/index.html to their folders outside

async function fixHtmlInputs(...files) {
	await Promise.all(
		files.map(async (srcPath) => {
			const src = path.resolve(outDir, srcPath);
			const destPath = path.resolve(
				outDir,
				`./${srcPath.slice(contentRootDir.length, srcPath.length)}`,
			);

			await fs.mkdir(path.dirname(destPath), { recursive: true });

			// INFO: copies from $DIST/src/$x dir to $DIST/$x
			await fs.copyFile(src, destPath);
		}),
	);

	// INFO: It removes $DIST/src directory
	await fs.rm(path.resolve(outDir, contentRootDir), {
		recursive: true,
		force: true,
	});
}

await fixHtmlInputs(...htmlFiles);
