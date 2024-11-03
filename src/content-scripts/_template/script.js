import * as browser from "webextension-polyfill";

const logger = {
	debug: (...msg) => {
		console.debug("[control-center: removes-youtube-shorts]", ...msg);
	},
	info: (...msg) => {
		console.info("[control-center: removes-youtube-shorts]", ...msg);
	},
	error: (err, when) => {
		console.error(
			"[control-center: removes-youtube-shorts]",
			err,
			"when",
			when,
		);
	},
};

logger.debug("loaded");

async function getOption(key, defaultVal) {
	try {
		const item = await browser.storage.local.get(key);
		if (item?.[key]) {
			return item[key];
		}
		await browser.storage.local.set({ [key]: defaultVal });
		return defaultVal;
	} catch (err) {
		logger.error(err, "setting/getting item from extension local storage");
	}
}
