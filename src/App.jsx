import { produce } from "immer";
import { createSignal, createMemo, createEffect, createResource, For } from "solid-js";

import { browserApi } from "./webext-apis/browser-api";
import { musicControls } from "./webext-apis/music-controls";

import Fuse from 'fuse.js';
import { Tab } from "./components/tab";
import { Page } from './components/page';

import { Checkbox } from 'solid-blocks';
import { logger } from './pkg/logger';
import { FiSettings } from 'solid-icons/fi'
// import { Checkbox, CheckboxLabel, CheckboxInput, CheckboxControl } from '@ark-ui/solid';

const DISABLE_SETTINGS_ICON = true

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
  const [tabsMap, { mutate, refetch }] = createResource(async () => {
    const t = await browserApi.listAllTabs()

    const listOfTabs = t.reduce((acc, curr, idx) => {
      if (curr.url === browser.runtime.getURL("src/background.html")) {
        logger.debug("this tab belongs to a firefox extension, so leaving it out")
        return acc
      }

      curr.index = idx + 1

      // logger.info({ idx: acc.idx }, "acc index")
      return { ...acc, [curr.id]: curr }
    }, {})

    return listOfTabs
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
    refetch()
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

  async function checkMusicEvents(activeTabId, event) {
    const activeUrl = tabsMap()[activeTabId]?.url || ""
    switch (event.keyCode) {
      case 39: // right Arrow
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          return musicControls.nextSong(activeTabId)
        }
      case 37: // left Arrow
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          return musicControls.prevSong(activeTabId)
        }
      case 32: // space
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          console.log("PAUSE SONG")
          return musicControls.pauseSong(activeTabId)
        }
    }

    return false
  }

  function onKeyDown(event) {
    (async () => {
      const activeTabId = matchedTabs().list[activeMatch()]

      const musicEvent = await checkMusicEvents(activeTabId, event)

      if (musicEvent) {
        console.log("music event:", musicEvent)
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
        setQuery("")
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

        setQuery("")
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

        setQuery("")
      }

      if (event.ctrlKey && event.key == "x") {
        // it means operate on all the matches
        setSelectAllFilter(curr => !curr)
      }
    })()
  }

  let inputRef;
  setInterval(() => {
    // INFO: this is a hack to make sure that the input is always focused
    if (inputRef && inputRef.current != document.activeElement) {
      inputRef.focus()
    }
  })

  return <Page.Root>
    <div class="px-12 py-4 flex-1 flex flex-col gap-3 dark:bg-slate-800" onKeyDown={onKeyDown}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const tabId = matchedTabs().list[activeMatch()]
          await browser.tabs.update(tabId, { active: true });
          setQuery("")
        }}
        class="flex flex-row gap-4 sticky top-2"
      >
        <input
          type="text"
          ref={inputRef}
          autoFocus
          placeholder="Search Your Tabs"
          value={query()}
          class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 w-full px-4 py-2 text-lg leading-4 tracking-wider focus:outline-none flex-1"
          onInput={(e) => {
            setQuery(e.target.value);
          }}
        />

        <div class="flex gap-2 items-center">
          <label for={"group-filter"} class="dark:text-blue-50 ">Group Filter</label>
          <Checkbox id="group-filter" switch checked={selectAllFilter()} class="w-5 h-5 rounded-sm checked:bg-blue-400 dark:bg-slate-900" />
        </div>

        {DISABLE_SETTINGS_ICON || <button class="flex gap-2 items-center dark:text-slate-200 text-blue-200" onClick={() => {
          (async () => {
            try {
              const x = await browser.runtime.openOptionsPage()
              console.log(x)
            } catch {
              console.error(err)
            }
          })()
        }}>
          <FiSettings class="w-5 h-5" />
        </button>}


      </form>

      <div class="text-medium text-2xl dark:text-gray-200">Tabs ({Object.keys(matchedTabs().list || {}).length}/{Object.keys(tabsMap()).length})</div>

      <div class="flex flex-col gap-2">
        <For each={matchedTabs().list}>
          {(tabId, idx) => {
            return (
              <Tab
                index={tabsMap()[tabId]?.index}
                // index={idx() + 1}
                // inputRef={inputRef}
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
