import path from "node:path";
import { defineConfig } from "rolldown-vite";
import solidPlugin from "vite-plugin-solid";
// import chromeManifest from "./manifest.chrome.json" with { type: "json" };
// import firefoxManifest from "./manifest.firefox.json" with { type: "json" };
import tailwindcss from "@tailwindcss/vite";
import { globSync } from "node:fs";
import { fileURLToPath } from "node:url";

function isFirefox() {
	return process.env.VITE_BUILD_FOR_FIREFOX === "true";
}

const inputs = Object.fromEntries(
	[
		"src/background.html",
		"src/options.html",
		"src/content-scripts/**/*.js",
		"src/scripts/*",
		// "icons/*",
	]
		.flatMap((g) => globSync(g))
		.map((file) => {
			// const rel = path.relative("./src", file);
			// if (rel.startsWith("..")) {
			// 	return [file, fileURLToPath(new URL(file, import.meta.url))];
			// }
			return [file, fileURLToPath(new URL(file, import.meta.url))];
		}),
);

export default defineConfig({
	plugins: [solidPlugin(), tailwindcss()],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
		sourcemap: process.env.VITE_RUN_MODE === "dev" ? "inline" : false,
		outDir: isFirefox()
			? process.env.VITE_BUILD_DIR_FIREFOX
			: process.env.VITE_BUILD_DIR_CHROME,
		rollupOptions: {
			treeshake: true,
			input: inputs,
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name.endsWith(".js")) {
						return "[name]";
					}

					if (chunkInfo.name.endsWith("ts")) {
						return chunkInfo.name.replace(/.ts$/, ".js");
					}
					return "[name].js";
				},
				// entryFileNames: "[name].js",
				// assetFileNames: (asset) => {
				// 	// if (asset.originalFileName?.startsWith("icons/")) {
				// 	// 	return "icons/[name][extname]";
				// 	// }
				// 	//
				// 	return "assets/[name]-[hash][extname]";
				// },
			},
		},
	},
});
