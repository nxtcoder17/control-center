import * as browser from "webextension-polyfill";

const scriptName = "removes-youtube-shorts";

/* boilerplate */
const prefix = `[control-center/${scriptName}]`;

const logger = {
  debug: (...msg) => console.debug(prefix, ...msg),
  info: (...msg) => console.info(prefix, ...msg),
  error: (err, why) => console.error(prefix, err, why),
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

/* boilerplate finish*/

const [optRemoveYTShorts, optCustomYTShortsSelectors] = await Promise.all([
  getOption("scripts.youtube-shorts.remove", true),
  getOption("scripts.youtube-shorts.css-selectors", []),
]);

const ytShortsSelectors = [
  "ytd-rich-section-renderer div#content", //[refer here](https://github.com/user-attachments/assets/1325c389-9dec-474e-a13c-45161f1ef8a1)
  "ytd-reel-shelf-renderer",
  ...optCustomYTShortsSelectors,
];

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
