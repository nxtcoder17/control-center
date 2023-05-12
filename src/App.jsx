import { produce } from "immer";
import { createSignal, createMemo, createEffect, createResource, For } from "solid-js";

import { browserApi } from "./webext-apis/browser-api";
import Fuse from 'fuse.js';
import { spotifyWebControls } from "./webext-apis/spotify-controls";
import { Tab } from "./components/tab";
import { Page } from './components/page';

import { Checkbox } from 'solid-blocks';
// import { Checkbox, CheckboxLabel, CheckboxInput, CheckboxControl } from '@ark-ui/solid';


function fuzzyFindTabs(tabs, query) {
  const sortPredicate = (a, b) => a.index - b.index;

  if (query === "") {
    return {
      list: tabs.sort(sortPredicate).map(item => item.id),
      data: tabs.reduce((acc, curr) => {
        return { ...acc, [curr.id]: curr }
      }, {})
    }
  }

  const f = new Fuse(tabs || [], {
    keys: ['index', 'title', 'url'],
    includeScore: false,
    includeMatches: true,
    useExtendedSearch: true,
  });

  const results = f.search(query)

  return {
    list: results.sort(sortPredicate).map(result => result.item.id),
    data: results.reduce((acc, curr) => {
      return { ...acc, [curr.item.id]: curr }
    }, {})
  }
}

function App() {
  // eslint-disable-next-line solid/reactivity
  const [tabsMap, { mutate }] = createResource(async () => {
    const t = await browserApi.listAllTabs()
    const lTabs = t.reduce((acc, curr) => {
      // const x = browser.runtime.getURL("src/background.html")
      if (curr.url === browser.runtime.getURL("src/background.html")) {
        // logger.info({ backgrounUrl: x, currentUrl: curr.url }, "this tab belongs to a firefox extension, so leaving it out")
        return acc
      }
      return { ...acc, [curr.id]: curr }
    }, {})

    return lTabs
  }, {
    initialValue: {},
  })

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    mutate(produce(t => {
      if (tab.url === browser.runtime.getURL("src/background.html")) {
        return
      }
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
    if (activeMatch() >= matchedTabs().list.length) {
      setActiveMatch(0)
    }

    if (activeMatch() < 0) {
      setActiveMatch(matchedTabs().list.length - 1)
    }
  })

  // Reset activeMatch everytime, when query changes
  createEffect((prev = "") => {
    const currQuery = query()
    if (prev !== currQuery) {
      setActiveMatch(0)
    }
    return currQuery
  })

  const matchedTabs = createMemo(() => {
    return fuzzyFindTabs(Object.values(tabsMap()), query())
  });

  const [selectAllFilter, setSelectAllFilter] = createSignal(false)

  function onKeyDown(event) {
    const activeTabId = matchedTabs().list[activeMatch()]

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
      const tabId = matchedTabs().list[activeMatch()]
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
      const tabId = matchedTabs().list[activeMatch()]
      if (tabId) {
        (async () => {
          await browserApi.toggleMute(tabId);
        })()
      }
      return
    }

    if (event.ctrlKey && event.key === "d") {
      event.preventDefault();

      if (selectAllFilter()) {
        const p = matchedTabs().list.map(async tabId => browserApi.closeTab(tabId));

        (async () => await Promise.all(p))()
        setSelectAllFilter(false)
        return
      }

      const tabId = matchedTabs().list[activeMatch()]
      if (tabId) {
        (async () => {
          await browserApi.closeTab(tabId);
        })()
      }
    }

    if (event.ctrlKey && event.key == "x") {
      // it means operate on all the matches
      setSelectAllFilter(curr => !curr)
    }
  }

  return <Page.Root>
    <div class="px-12 py-4 flex-1 flex flex-col gap-3 dark:bg-slate-800" onKeyDown={onKeyDown}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const tabId = matchedTabs().list[activeMatch()]
        await browser.tabs.update(tabId, { active: true });
        setQuery("")
      }}
        class="flex flex-row gap-2"
      >
        <input
          type="text"
          autoFocus
          placeholder="Search Your Tabs"
          value={query()}
          class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 w-full px-4 py-2 text-lg leading-4 tracking-wider focus:outline-none sticky flex-1"
          onInput={(e) => {
            setQuery(e.target.value);
          }}
        />

        <div class="flex gap-2 items-center">
          <label for={"group-filter"} class="dark:text-blue-50 ">Group Filter</label>
          <Checkbox id="group-filter" switch checked={selectAllFilter()} class="w-5 h-5 rounded-sm checked:bg-blue-400 dark:bg-slate-900" />
        </div>

      </form>

      <div class="text-medium text-2xl dark:text-gray-200">Tabs ({Object.keys(matchedTabs().list || {}).length}/{Object.keys(tabsMap()).length})</div>

      <div class="flex flex-col gap-1">
        <For each={matchedTabs().list}>
          {(tabId, idx) => {
            return (
              <Tab
                // index={tabsMap()[tabId]?.index}
                index={idx() + 1}
                tabInfo={tabsMap()[tabId] || {}}
                isSelected={activeMatch() === idx()}
                matches={matchedTabs().data[tabId].matches}
                onClick={() => {
                  (async () => {
                    await browser.tabs.update(tabId, { active: true });
                  })();
                }}
              />
            )
          }}
        </For>
      </div>

    </div>
  </Page.Root >
}

export default App;
