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
import { PowerlineIcon } from "./components/icons";

const DISABLE_SETTINGS_ICON = true

function fuzzyFindTabs(tabs, query) {
  const sortPredicate = (a, b) => a.index - b.index;

  // const data = Object.assign({}, tabs.data)
  const data = JSON.parse(JSON.stringify(tabs.data));

  if (query === "") {
    return tabs
    // return {
    //   list: tabs.list.sort(sortPredicate).map(item => item.id),
    //   data: tabs.data,
    //   // data: tabs.reduce((acc, curr) => {
    //   //   return { ...acc, [curr.id]: curr }
    //   // }, {})
    // }
  }

  if (query.startsWith("`")) {
    const bTabs = Object.keys(tabs.tabToMarks).filter(i => i in data && data[i].url == tabs.tabToMarks[i].url).map(tabId => {
      return {
        ...tabs.data[tabId],
        cc_extras: { ...tabs.tabToMarks[tabId], mark: '`' + tabs.tabToMarks[tabId].mark },
      }
    })

    const qt = query.slice(1).toUpperCase()
    if (qt == "") {
      return {
        list: bTabs.sort(sortPredicate).map(tab => tab.id),
        data: bTabs.reduce((acc, curr) => {
          return { ...acc, [curr.id]: curr }
        }, {})
      }
    }

    const f = new Fuse(bTabs || [], {
      // keys: ['cc_extras.bookmark', 'index', 'title', 'url'],
      keys: ['cc_extras.mark'],
      includeScore: false,
      includeMatches: true,
      useExtendedSearch: true,
      minMatchCharLength: 0,
    });


    const results = f.search(query.slice(1).toUpperCase())

    logger.info({ results })

    return {
      list: results?.sort(sortPredicate).map(result => result.item.id),
      data: results?.reduce((acc, curr) => {
        return { ...acc, [curr.item.id]: curr }
      }, {})
    }
  }

  const f = new Fuse(Object.values(tabs.data) || [], {
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
  const [listOfTabs, { _mutate, refetch }] = createResource(async () => browserApi.listAllTabs(), { initialValue: [] })

  const [tabs, setTabs] = createSignal({ list: [], data: {} })
  createEffect(() => {
    const t = listOfTabs();
    (async () => {
      const _tabs = t.reduce((acc, curr, idx) => {
        curr.index = idx + 1

        return {
          list: [...acc.list, curr.id],
          data: {
            ...acc.data, [curr.id]: { ...curr }
          },
        }
      }, { list: [], data: {}, extraData: {} });


      setTabs(prev => {
        return {
          list: _tabs.list,
          data: _tabs.data || {},
        }
      })
    })()
  })

  browser.tabs.onUpdated.addListener(() => refetch())
  browser.tabs.onRemoved.addListener(() => refetch());

  // browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  //   setTabs(produce(t => {
  //     if (tabId in t.data) {
  //       tab.index = t.list.length + 1
  //       t.data[tabId] = tab
  //       t.list.push(tabId)
  //     }
  //   }))
  // })
  //
  // browser.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  //   setTabs(produce(t => {
  //     if (tabId in t.data) {
  //       tab.index = t.list.length + 1
  //       t.data[tabId] = tab
  //       t.list.push(tabId)
  //     }
  //   }))
  // })

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

  createEffect(() => {
    if (query().length == 2 && query().startsWith("`")) {
      (async () => {
        const mt = vimMarks().marksToTab
        logger.info({ query: query().slice(1).toUpperCase(), vimMarks: mt });
        await browser.tabs.update(Number(mt[query().slice(1).toUpperCase()].tabId), { active: true });
        setQuery("")
      })()
    }
  })

  const [vimMarks, { mutate: setVimMarks, refetch: refetchVimMarks }] = createResource(async () => browserApi.localStore.get("tabs-vim-marks"), { initialValue: { tabToMarks: {}, setVimMarks: {} } })

  // const [vimMarks, setVimMarks] = createSignal({ tabToMarks: {}, marksToTab: {} })

  const matchedTabs = createMemo(() => {
    return fuzzyFindTabs({ list: tabs().list, data: tabs().data, tabToMarks: vimMarks().tabToMarks }, query())
  });

  const [actionMode, setActionMode] = createSignal(false)

  async function checkMusicEvents(activeTabId, event) {

    const activeUrl = tabs().data[activeTabId]?.url || ""
    switch (event.keyCode) {
      case 39: // right Arrow
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          event.preventDefault()
          return musicControls.nextSong(activeTabId)
        }
        break
      case 37: // left Arrow
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          event.preventDefault()
          return musicControls.prevSong(activeTabId)
        }
        break
      case 32: // space
        if (activeUrl.includes("spotify.com") || activeUrl.includes("music.youtube.com")) {
          event.preventDefault()
          return musicControls.playOrPauseSong(activeTabId)
        }
        break
    }

    return false
  }

  function onKeyDown(event) {
    (async () => {
      const activeTabId = matchedTabs().list[activeMatch()]

      if (event.ctrlKey && event.key === "x") {
        event.preventDefault();
        setActionMode((v) => !v)
        return
      }

      if (event.key === "ArrowUp") {
        setActiveMatch((am) => am - 1);
        return
      }

      if (event.key === "ArrowDown") {
        setActiveMatch((am) => am + 1);
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

      if (actionMode()) {
        if (event.keyCode == 27 /* escape key */) {
          setActionMode(false)
          return
        }

        const musicEvent = await checkMusicEvents(activeTabId, event)

        if (musicEvent) {
          return
        }
      }
    })()
  }

  createEffect(() => {
    if (actionCommand().startsWith("m") && actionCommand().length == 2) {
      const tabId = matchedTabs().list[activeMatch()]
      setVimMarks(produce(m => {
        if (!m.tabToMarks) {
          m.tabToMarks = {}
        }

        if (!m.marksToTab) {
          m.marksToTab = {}
        }

        m.tabToMarks[tabId] = { mark: actionCommand().charAt(1).toUpperCase(), url: tabs().data[tabId].url }
        m.marksToTab[actionCommand().charAt(1).toUpperCase()] = { tabId: tabId, url: tabs().data[tabId].url }
      }))

      // setTabs(produce(t => {
      //   if (!(tabId in t.extraData)) {
      //     t.extraData[tabId] = {}
      //   }
      //   t.extraData[tabId].bookmark = actionCommand().charAt(1).toUpperCase()
      //   logger.info(`set bookmark for tab (${t.data[tabId].title}): ${t.extraData[tabId].bookmark}`)
      // }))

      console.log("HERE")

      setActionCommand("")
      setQuery("")
      setActionMode(false)
    }
  })

  createEffect(() => {
    if (vimMarks()) {
      (async () => {
        await browserApi.localStore.set("tabs-vim-marks", vimMarks())
      })()
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
    <div class="px-16 py-6 flex-1 flex flex-col gap-3 dark:bg-slate-800" onKeyDown={onKeyDown}>
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

        <div class="flex gap-2 items-center bg-slate-900 px-2">
          <label for={"action-mode"} class="dark:text-slate-400 tracking-tight">Action Mode</label>
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

      <div class="text-medium text-2xl dark:text-gray-200">Tabs ({matchedTabs().list.length || 0}/{tabs().list.length})</div>

      <div class="flex flex-col gap-2 overflow-visible relative">
        <For each={matchedTabs().list}>
          {(tabId, idx) => {
            const url = matchedTabs()?.data[tabId]?.url
            const vimMarkObj = vimMarks().tabToMarks[tabId]

            console.log("vimMarkObj", vimMarkObj)

            return (
              <Tab
                index={tabs().data[tabId]?.index}
                vimMark={vimMarks().tabToMarks[tabId] && matchedTabs().data[tabId].url?.startsWith(vimMarks().tabToMarks[tabId].url) && vimMarks().tabToMarks[tabId].mark}
                tabInfo={tabs().data[tabId] || {}}
                isSelected={activeMatch() === idx()}
                matches={matchedTabs()?.data[tabId].matches}
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
