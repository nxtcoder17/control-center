import * as browser from "webextension-polyfill";

async function getOptions() {
	const key = "options";
	const item = await browser.storage.local.get(key);
	return item[key];
}

console.log(
	"[control-center:youtube.com] removing stuffs content script loaded",
);

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
	const items = document.querySelectorAll(selector);
	if (items.length > 0) {
		// console.log('[control-center] found these youtube shorts, removing them', items)
		items.forEach((item) => {
			item.remove();
		});
	}
}

const opts = await getOptions();
observeAndAct(() => {
	opts.ytShortsSelectors.split("\n").forEach((selector) => {
		removeFromDOM(selector);
	});
	removeFromDOM(opts.ytShortsSelectors);
});

// observeAndAct(() => {
// 	(async () => {
// 		const opts = await getOptions();
// 	})();
//
// 	// removeFromDOM("[is-shorts]");
// 	// removeFromDOM("ytd-reel-shelf-renderer");
// });
