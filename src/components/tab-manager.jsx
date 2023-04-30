import { For } from "solid-js";
import { Tab } from './tab'

export const TabManager = (props) => {
  return <For each={props.matchedTabs}>
    {(tabId, idx) => (
      <Tab
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
