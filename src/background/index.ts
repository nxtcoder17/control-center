import * as browser from "webextension-polyfill";
import { newLogger } from "../pkg/logger";
import { browserApi } from "../pkg/browser-api";

globalThis.logger = newLogger();

const extensionTabURL = browser.runtime.getURL("app/index.html");

async function findExtensionTab() {
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

async function findPreviousTabID() {
	const tabs = await browser.tabs.query({ active: true });

	// INFO: #tabs won't be 0, as we are anyway creating a tab
	return tabs.length >= 2 ? tabs[1].id : tabs[0].id;
}

async function init() {
	const extensionTabId = await findExtensionTab();
	let prevTabID: number | undefined;

	const toggleTab = async () => {
		const [currTab] = await browser.tabs.query({ active: true });
		if (currTab.id === extensionTabId) {
			if (!(await browserApi.tabExists(prevTabID))) {
				prevTabID = await findPreviousTabID();
			}

			logger.debug("prev tab", "id", prevTabID);

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
		logger.debug("received", "command", command);
		if (command === "control-center") {
			toggleTab().catch((err) => {
				throw err;
			});
		}
	});
}

init().catch((err: Error) => {
	logger.error(err, "init app");
});
