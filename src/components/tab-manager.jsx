import { For } from "solid-js";
import { BrowserTab } from './browser-tab'

export const TabManager = (props) => {
  return <For each={props.matchedTabs}>
    {(tabId, idx) => (
      <BrowserTab
        index={props.tabsMap[tabId]?.index}
        tabInfo={props.tabsMap[tabId] || {}}
        isSelected={props.activeMatch === idx()}
        onClick={() => {
          (async () => {
            await browser.tabs.update(tabId, { active: true });
          })();
        }}
      />
    )}
  </For>
};
