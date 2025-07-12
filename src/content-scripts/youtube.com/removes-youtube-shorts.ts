import { newLogger } from "../../pkg/logger";
import { browserApi } from "../../pkg/browser-api";
import { observeAndAct } from "../../pkg/dom/observe-and-act";
import {
	OPT_YT_SHORTS_CSS_SELECTORS,
	OPT_YT_SHORTS_REMOVE,
} from "../../constants/store-keys";

const logger = newLogger("removes-youtube-shorts");

async function main() {
	const [optRemoveYTShorts, optCustomYTShortsSelectors] = await Promise.all([
		browserApi.localStore.get(OPT_YT_SHORTS_REMOVE),
		browserApi.localStore.get(OPT_YT_SHORTS_CSS_SELECTORS),
	]);

	logger.debug(
		"store",
		"scripts.youtube-shorts.remove",
		optRemoveYTShorts,
		"scripts.youtube-shorts.css-selectors",
		optCustomYTShortsSelectors,
	);

	const ytShortsSelectors = [
		"ytd-rich-section-renderer div#content", //[refer here](https://github.com/user-attachments/assets/1325c389-9dec-474e-a13c-45161f1ef8a1)
		"ytd-reel-shelf-renderer",
		...(optCustomYTShortsSelectors || []),
	];

	function removeFromDOM(selector) {
		// FIXME: we are selecting all the elements again, and again, even though we have filtered it
		console.log("will find youtube shorts", "for.selector", selector);
		const items = document.querySelectorAll(selector);
		if (!items) {
			return;
		}
		if (items.length > 0) {
			logger.debug(
				"found these youtube shorts, removing them",
				items,
				"via.selector",
				selector,
			);
			for (const item of items) {
				if (item) {
					item.remove();
				}
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
