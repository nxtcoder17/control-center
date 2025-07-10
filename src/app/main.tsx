/* @refresh reload */
import { render } from "solid-js/web";
import Page from "./page";
import "../pkg/ui/css/tailwind.css";
import { newLogger } from "../pkg/logger";
import { TabStoreProvider } from "./stores/tab-store";

const isDev = import.meta.env.VITE_RUN_MODE === "dev";

globalThis.logger = newLogger();

const root = document.getElementById("root");

if (root == null || (isDev && !(root instanceof HTMLElement))) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
	);
}
render(
	() => (
		<TabStoreProvider>
			<Page />
		</TabStoreProvider>
	),
	root,
);
