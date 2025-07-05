/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import { OptionsPage } from "./options/page";
import { newLogger } from "./pkg/logger";

const root = document.getElementById("root");

globalThis.logger = newLogger("control-center/options");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?",
	);
}

render(() => <OptionsPage />, root);
