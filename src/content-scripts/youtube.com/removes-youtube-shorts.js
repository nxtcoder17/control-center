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

const shouldRemoveYTShorts = await getOption(
	"scripts.youtube-shorts.remove",
	true,
);

const defaultSelectors = [
	"ytd-rich-section-renderer div#content", // as of Nov 3, 2024 [documented here](https://github.com/user-attachments/assets/1325c389-9dec-474e-a13c-45161f1ef8a1)
];

const userYTShortsSelectors = await getOption(
	"scripts.youtube-shorts.css-selectors",
	[],
);

const ytShortsSelectors = [...defaultSelectors, ...userYTShortsSelectors];

if (shouldRemoveYTShorts) {
	logger.info(
		`should remove youtube shorts with selectors: ${ytShortsSelectors}`,
	);
}

function observeAndAct(action) {
	const observer = new MutationObserver(() => {
		action();
	});

	observer.observe(document.body, {
		subtree: true,
		childList: true,
	});

	return observer;
}

function removeFromDOM(selector) {
	// FIXME: we are selecting all the elements again, and again, even though we have filtered it
	const items = document.querySelectorAll(selector);
	if (items.length > 0) {
		logger.debug("found these youtube shorts, removing them", items);
		items.forEach((item) => {
			item.remove();
		});
	}
}

observeAndAct(() => {
	ytShortsSelectors.forEach((selector) => {
		if (selector) {
			removeFromDOM(selector);
		}
	});
});
