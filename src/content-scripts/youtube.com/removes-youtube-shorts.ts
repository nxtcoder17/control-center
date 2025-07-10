import { newLogger } from "../../pkg/logger";
import { browserApi } from "../../pkg/browser-api";
import { observeAndAct } from "../../pkg/dom/observe-and-act";

const logger = newLogger("removes-youtube-shorts");

async function main() {
	const [optRemoveYTShorts, optCustomYTShortsSelectors] = await Promise.all([
		browserApi.localStore.get("scripts.youtube-shorts.remove") || true,
		browserApi.localStore.get("scripts.youtube-shorts.css-selectors") || [],
	]);

	const ytShortsSelectors = [
		"ytd-rich-section-renderer div#content", //[refer here](https://github.com/user-attachments/assets/1325c389-9dec-474e-a13c-45161f1ef8a1)
		"ytd-reel-shelf-renderer",
		...optCustomYTShortsSelectors,
	];

	function removeFromDOM(selector) {
		// FIXME: we are selecting all the elements again, and again, even though we have filtered it
		const items = document.querySelectorAll(selector);
		if (items.length > 0) {
			logger.debug("found these youtube shorts, removing them", items);
			for (const item of items) {
				item.remove();
			}
		}
	}

	if (optRemoveYTShorts) {
		logger.info(
			`should remove youtube shorts with selectors: ${ytShortsSelectors}`,
		);

		observeAndAct(() => {
			ytShortsSelectors.forEach(removeFromDOM);
		});
	}
}

(async () => {
	try {
		await main();
	} catch (err) {
		logger.error(err, "loading removes-youtube-shorts script");
	}
})();
