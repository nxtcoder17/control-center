import { produce } from "immer";
import { For, createResource, createSignal, createComputed, onCleanup, batch, createEffect, createMemo } from "solid-js";

import { Tab } from './components/tab';
import { browserApi } from "./webext-apis/browser-api";
import Fuse from 'fuse.js';
import { spotifyWebControls } from "./webext-apis/spotify-controls";

function fuzzyFindTabs(tabs, query) {
  // console.log("tabs: ", tabs, "query: ", query)
  if (query === "") {
    return tabs.map(item => item.id)
  }
  const f = new Fuse(tabs || [], {
    keys: ['title', 'url'],
    includeScore: true,
    useExtendedSearch: true,
  });
  const results = f.search(query);
  console.log("results: ", results)
  return results.map(result => result.item.id)
}

function App() {
  const [readTabs, { refetch }] = createResource(async () => {
    return browserApi.listAllTabs();
  }, {
    initialValue: [],
  });

  // let timer = setInterval(() => {
  //   refetch()
  // }, 500)
  // onCleanup(() => clearInterval(timer))

  // const readTabs = createMemo(() => {
  //   const t = tabs()
  //   return t;
  // }, null, {
  //   equals: (prev, next) => {
  //     if (prev.length != next.length) {
  //       return false
  //     }
  //     for (let i = 0; i < next.length; ++i) {
  //       // if (JSON.stringify(next[i]) !== JSON.stringify(prev[i])) {
  //       console.log("next[i].id == prev[i].id", next[i].id, prev[i].id, next[i].id == prev[i].id)
  //       if (next[i].id != prev[i].id) {
  //         return false
  //       }
  //     }
  //     return true
  //   },
  // })


  const [tabsMap, setTabsMap] = createSignal({})
  createComputed(() => {
    setTabsMap(() => {
      return readTabs().reduce((acc, curr) => {
        return { ...acc, [curr.id]: curr }
      }, {})
    })
  })

  // const [matchedTabs, setMatchedTabs] = createSignal([]);
  // createComputed(() => {
  //   setMatchedTabs(mt => {
  //     if (mt.length == 0) {
  //       return tabs().map(t => t.id)
  //     }
  //     return [...mt]
  //   })
  // })

  const [query, setQuery] = createSignal('');
  const [activeMatch, setActiveMatch] = createSignal(0);

  const matchedTabs = createMemo(() => fuzzyFindTabs(readTabs(), query()), [], {
    // equals: false,
    equals: (prev, next) => {
      console.log("prev: ", prev, "next:", next)
      if (prev.length != next.length) {
        return false
      }
      for (let i = 0; i <= next.length; ++i) {
        if (next[i] != prev[i]) {
          return false
        }
      }
      return true
    }
  });

  function onKeyDown(event) {
    // console.log("event:", event.ctrlKey, event.key)
    // eslint-disable-next-line default-case

    // console.log("tabId: ", matchedTabs()[activeMatch()])
    // console.log("active tab: ", tabsMap()[matchedTabs()[activeMatch()]])
    // console.log("active url: ", tabsMap()[matchedTabs()[activeMatch()]].url)
    //
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
        setTabsMap(produce(t => {
          t[tabId].pinned = !t[tabId].pinned;
        }));
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
        setTabsMap(produce(t => {
          t[tabId].mutedInfo.muted = !t[tabId].mutedInfo.muted;
        }));
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

        batch(() => {
          // setMatchedTabs(mt => {
          //   return mt.filter(t => {
          //     return t !== tabId
          //   })
          // })
          setTabsMap(produce(t => { delete t[tabId] }));
        })
      }
    }
  }


  // createComputed(() => {
  //   const f = new Fuse(tabs() || [], {
  //     keys: ['title', 'url'],
  //     includeScore: true,
  //     useExtendedSearch: true,
  //   });
  //   const results = f.search(query());
  //   console.log("results: ", results)
  //   setMatchedTabs(results.map(result => result.item.id));
  // })

  return (
    <div class="h-screen w-screen overflow-none py-4 px-4 dark:bg-slate-800" onKeyDown={onKeyDown}>
      <div class="h-full w-full overflow-auto">
        <div class="flex flex-col gap-2">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const tabId = matchedTabs()[activeMatch()];
            await browser.tabs.update(tabId, { active: true });
            setQuery("")
            // await browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
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

          <For each={matchedTabs()}>
            {(tabId, idx) => (
              <Tab
                tabInfo={tabsMap()[tabId]}
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
