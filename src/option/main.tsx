/* @refresh reload */
import { render } from "solid-js/web";
import { OptionsPage } from "./page";
import { newLogger } from "../pkg/logger";
import "../pkg/ui/css/tailwind.css";

const root = document.getElementById("root");

globalThis.logger = newLogger("options");

const isDev = import.meta.env.VITE_RUN_MODE === "dev";

if (root == null || (isDev && !(root instanceof HTMLElement))) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?",
	);
}

render(() => <OptionsPage />, root);
