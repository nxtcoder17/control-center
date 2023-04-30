import { produce } from "immer";
import { For, createSignal, createMemo, createEffect, createResource } from "solid-js";

import { Tab } from './components/tab';
import { browserApi } from "./webext-apis/browser-api";
import Fuse from 'fuse.js';
import { spotifyWebControls } from "./webext-apis/spotify-controls";

function fuzzyFindTabs(tabs, query) {
  const sortPredicate = (a, b) => a.index - b.index;

  if (query === "") {
    return tabs.sort(sortPredicate).map(item => item.id)
  }

  const f = new Fuse(tabs || [], {
    keys: ['index', 'title', 'url'],
    includeScore: false,
    includeMatches: true,
    useExtendedSearch: true,
  });

  const results = f.search(query);
  console.log("results: ", results)
  return results.sort(sortPredicate).map(result => result.item.id)
}

function App() {
  // eslint-disable-next-line solid/reactivity
  const [tabsMap, { mutate }] = createResource(async () => {
    const t = await browserApi.listAllTabs()
    return t.reduce((acc, curr) => {
      const x = browser.runtime.getURL("src/background.html")
      console.log("current: ", curr.url, typeof curr.url, "extension background.html:", x, typeof x, curr.url === x)
      if (curr.url === browser.runtime.getURL("src/background.html")) {
        return acc
      }
      return { ...acc, [curr.id]: curr }
    }, {})
  }, {
    initialValue: {},
  })

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    mutate(produce(t => {
      t[tabId] = tab
    }))
  })

  browser.tabs.onRemoved.addListener((tabId, _removeInfo) => {
    mutate(produce(t => {
      delete t[tabId];
    }))
  })

  const [query, setQuery] = createSignal('');
  const [activeMatch, setActiveMatch] = createSignal(0);

  createEffect(() => {
    // cycles up and down arrow in list
    if (activeMatch() >= matchedTabs().length) {
      setActiveMatch(0)
    }

    if (activeMatch() < 0) {
      setActiveMatch(matchedTabs().length - 1)
    }
  })

  // Reset activeMatch everytime, when query changes
  createEffect((prev) => {
    if (prev !== query()) {
      setActiveMatch(0)
    }
  }, "")

  const matchedTabs = createMemo(() => fuzzyFindTabs(Object.values(tabsMap()), query()));

  function onKeyDown(event) {
    const activeTabId = matchedTabs()[activeMatch()]

    if (event.key == "ArrowRight" && tabsMap()[activeTabId]?.url?.includes("spotify.com")) {
      (async () => {
        await spotifyWebControls.nextSong(activeTabId)
      })()
      return
    }

    if (event.key == "ArrowLeft" && tabsMap()[activeTabId].url?.includes("spotify.com")) {
      (async () => {
        await spotifyWebControls.prevSong(activeTabId)
      })()
      return
    }

    if ((event.keyCode === 32 || event.which === 32) && tabsMap()[activeTabId].url?.includes("spotify.com")) {
      (async () => {
        await spotifyWebControls.pauseSong(activeTabId)
      })()
      return
    }

    if (event.key === "ArrowDown") {
      setActiveMatch((am) => am + 1);
      return
    }

    if (event.key === "ArrowUp") {
      setActiveMatch((am) => am - 1);
      return
    }

    if (event.ctrlKey && event.key === "p") {
      event.preventDefault();
      console.log("this tab should be toggled pin/unpin")
      const tabId = matchedTabs()[activeMatch()];
      if (tabId) {
        (async () => {
          await browserApi.togglePin(tabId);
        })()
      }
      return
    }

    if (event.ctrlKey && event.key === "f") {
      event.preventDefault()
      return
    }


    if (event.ctrlKey && event.key === "m") {
      event.preventDefault();
      console.log("this tab should be toggled muted/unmute")
      const tabId = matchedTabs()[activeMatch()];
      if (tabId) {
        (async () => {
          await browserApi.toggleMute(tabId);
        })()
      }
      return
    }

    if (event.ctrlKey && event.key === "d") {
      event.preventDefault();
      const tabId = matchedTabs()[activeMatch()];
      if (tabId) {
        (async () => {
          await browserApi.closeTab(tabId);
        })()
      }
    }
  }

  return (
    <div class="h-screen w-screen overflow-none py-4 px-4 dark:bg-slate-800" onKeyDown={onKeyDown}>
      <div class="h-full w-full overflow-auto">
        <div class="flex flex-col gap-2">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const tabId = matchedTabs()[activeMatch()];
            await browser.tabs.update(tabId, { active: true });
            setQuery("")
          }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Search Your Tabs"
              value={query()}
              class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 w-full px-4 py-2 text-lg leading-4 tracking-wider focus:outline-none sticky"
              onInput={(e) => {
                setQuery(e.target.value);
              }}
            />
          </form>

          <div class="text-medium text-2xl dark:text-gray-200">Tabs ({Object.keys(matchedTabs() || {}).length}/{Object.keys(tabsMap()).length})</div>
          <For each={matchedTabs()}>
            {(tabId, idx) => (
              <Tab
                index={tabsMap()[tabId]?.index}
                tabInfo={tabsMap()[tabId] || {}}
                isSelected={activeMatch() === idx()}
                onClick={() => {
                  (async () => {
                    await browser.tabs.update(tabId, { active: true });
                  })();
                }}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

export default App;
