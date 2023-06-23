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

const DISABLE_SETTINGS_ICON = true

const PowerlineIcon = (props) => {
  return (
    <svg
      fill="currentColor"
      preserveAspectRatio="none"
      class={props.class}
      stroke-width="0"
      xmlns="http://www.w3.org/2000/svg"
      style={{ "overflow": "visible" }}
      viewBox="300 159.97 424 704.05"
    >
      <path d="M715.8 493.5 335 165.1c-14.2-12.2-35-1.2-35 18.5v656.8c0 19.7 20.8 30.7 35 18.5l380.8-328.4c10.9-9.4 10.9-27.6 0-37z" />
    </svg>
  )
}


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

      curr.ccExtras = {}

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
  const [actionCommand, setActionCommand] = createSignal('')

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

  // const [selectAllFilter, setSelectAllFilter] = createSignal(false)

  const [actionMode, setActionMode] = createSignal(false)

  async function checkMusicEvents(activeTabId, event) {
    const activeUrl = tabsMap()[activeTabId]?.url || ""
    switch (event.keyCode) {
      case 39: // right Arrow
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          return musicControls.nextSong(activeTabId)
        }
        break
      case 37: // left Arrow
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          return musicControls.prevSong(activeTabId)
        }
        break
      case 32: // space
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          console.log("PAUSE SONG")
          return musicControls.pauseSong(activeTabId)
        }
        break
    }

    return false
  }

  function onKeyDown(event) {
    (async () => {
      const activeTabId = matchedTabs().list[activeMatch()]

      const musicEvent = await checkMusicEvents(activeTabId, event)

      if (musicEvent) {
        return
      }

      if (event.ctrlKey && event.key === "x") {
        event.preventDefault();
        setActionMode((v) => !v)
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
          await browserApi.togglePin(tabId);
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
          await browserApi.toggleMute(tabId);
        }

        setQuery("")
        return
      }

      if (event.ctrlKey && event.key === "d") {
        event.preventDefault();

        if (actionMode()) {
          const p = matchedTabs().list.map(async tabId => browserApi.closeTab(tabId));
          await Promise.all(p)
          setActionMode(false)
          return
        }

        const tabId = matchedTabs().list[activeMatch()]
        if (tabId) {
          await browserApi.closeTab(tabId);
        }

        setQuery("")
      }
    })()
  }

  createEffect(() => {
    if (actionCommand().startsWith("m") && actionCommand().length == 2) {
      const tabId = matchedTabs().list[activeMatch()]
      mutate(produce(t => {
        t[tabId].ccExtras.bookMark = actionCommand().charAt(1).toUpperCase()
      }))
      setActionCommand("")
      setActionMode(false)
    }
  })

  let inputRef;
  setInterval(() => {
    // HACK: this is a hack to make sure that the input is always focused
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
        {/* <div class="focus-within:shadow-lg focus-within:ring-1 focus-within:ring-offset-2 focus-within:ring-offset-blue-900 rounded-md w-full bg-slate-100 dark:bg-slate-900 dark:text-blue-50 flex items-center"> */}
        <div class="focus-within:shadow-lg rounded-md w-full bg-slate-100 dark:bg-slate-900 dark:text-blue-50 flex">
          {actionMode() &&
            <div class="text-xl gap-2 pl-2 relative bg-slate-700 rounded-md">
              <div class="flex items-center text-slate-700">
                <div class="text-2xl text-slate-500">Action</div>
                <PowerlineIcon class="h-10 w-6 fill-slate-700 dark:bg-slate-900" />
              </div>
            </div>
          }

          {!actionMode() && <input
            type="text"
            ref={inputRef}
            autoFocus
            placeholder={"Search Your Tabs"}
            class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 rounded-md w-full px-4 py-2 text-lg leading-4 tracking-wider outline-none focus:outline-none border-none ring-0 focus:ring-0 flex-1 placeholder:font-bold placeholder:text-lg"
            value={query()}
            onInput={(e) => {
              setQuery(e.target.value);
            }}
          />
          }

          {actionMode() && <input
            type="text"
            ref={inputRef}
            autoFocus
            placeholder={"Trigger Your Tab Actions"}
            class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 rounded-md w-full px-4 py-2 text-lg leading-4 tracking-wider outline-none focus:outline-none border-none ring-0 focus:ring-0 flex-1 placeholder:font-bold placeholder:text-lg"
            value={actionCommand()}
            onInput={(e) => {
              setActionCommand(e.target.value);
            }}
          />}

        </div>

        <div class="flex gap-2 items-center">
          <label for={"action-mode"} class="dark:text-blue-50 ">Action Mode</label>
          <Checkbox id="action-mode" switch checked={actionMode()} class="w-5 h-5 rounded-sm checked:bg-blue-400 dark:bg-slate-900" />
        </div>

        {DISABLE_SETTINGS_ICON || <button class="flex gap-2 items-center dark:text-slate-200 text-blue-200" onClick={() => {
          (async () => {
            try {
              const x = await browser.runtime.openOptionsPage()
              console.log(x)
            } catch (err) {
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
                bookmark={tabsMap()[tabId]?.ccExtras?.bookmark}
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

    </div >
  </Page.Root >
}

export default App;
