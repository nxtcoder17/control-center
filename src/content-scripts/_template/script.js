import * as browser from "webextension-polyfill";

async function getOptions() {
	const key = "options";
	const item = await browser.storage.local.get(key);
	return item[key];
}
