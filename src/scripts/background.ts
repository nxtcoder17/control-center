import * as browser from "webextension-polyfill";
import { browserApi } from "../lib/webext-apis/browser-api";
import { newLogger } from "../pkg/logger";

globalThis.logger = newLogger("control-center");

logger.info("Loaded");

const extensionTabURL = browser.runtime.getURL("src/background.html");

async function findExtensionTab(): Promise<number> {
	const t = await browser.tabs.query({
		currentWindow: true,
		pinned: true,
		url: extensionTabURL,
	});

	if (t.length === 0) {
		const extensionTab = await browser.tabs.create({
			active: false,
			url: extensionTabURL,
			pinned: true,
		});

		return extensionTab.id;
	}

	return t[0].id;
}

async function findPreviousTabID(): Promise<number> {
	const tabs = await browser.tabs.query({ active: true });

	// INFO: #tabs won't be 0, as we are anyway creating a tab
	return tabs.length >= 2 ? tabs[1].id : tabs[0].id;
}

async function init() {
	const extensionTabId = await findExtensionTab();
	let prevTabID = -1;

	const toggleTab = async () => {
		const [currTab] = await browser.tabs.query({ active: true });
		// console.debug(`current tab id: ${currTab.id} extension tab id (${extensionTabId}) prev tab id: ${prevTabId}`)
		if (currTab.id === extensionTabId) {
			if (!(await browserApi.tabExists(prevTabID))) {
				prevTabID = await findPreviousTabID();
			}

			logger.debug("prev tab ID", "tabID", prevTabID);

			await browser.tabs.update(prevTabID, { active: true });
			return;
		}

		prevTabID = currTab.id;
		await browser.tabs.update(extensionTabId, {
			active: true,
			openerTabId: prevTabID,
		});
	};

	browser.commands.onCommand.addListener((command) => {
		if (command === "control-center") {
			toggleTab().catch((err) => {
				throw err;
			});
		}
	});
}

init().catch((err: Error) => {
	logger.error(err, "init | background.ts");
});
