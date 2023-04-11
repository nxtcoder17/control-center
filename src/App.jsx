import { produce } from "immer";
import { For, createSignal, batch, createMemo, createEffect, createResource } from "solid-js";

import { Tab } from './components/tab';
import { browserApi } from "./webext-apis/browser-api";
import Fuse from 'fuse.js';
import { spotifyWebControls } from "./webext-apis/spotify-controls";

function fuzzyFindTabs(tabs, query) {
  if (query === "") {
    return tabs.map(item => item.id)
  }
  const f = new Fuse(tabs || [], {
    keys: ['title', 'url'],
    includeScore: false,
    includeMatches: true,
    useExtendedSearch: true,
  });
  const results = f.search(query);
  console.log("results: ", results)
  return results.map(result => result.item.id)
}

function App() {
  // const [tabs, setTabs] = createSignal([], {
  //   equals: (prev, next) => {
  //     console.log("[equals]:", "start", prev.length, next.length)
  //     if (prev.length != next.length) {
  //       return false
  //     }
  //     console.log("[equals]:", "mid")
  //     for (let i = 0; i <= next.length; ++i) {
  //       if (!browserApi.areTabsEqual(prev[i], next[i])) {
  //         return false
  //       }
  //     }
  //     console.log("[equals]:", "end")
  //     return true
  //   }
  // });


  // let timer = setInterval(() => {
  //   (async () => {
  //     const t = await browserApi.listAllTabs()
  //     console.log("here ...", t)
  //     setTabs(t)
  //   })()
  // }, 500)
  // onCleanup(() => clearInterval(timer))

  // eslint-disable-next-line solid/reactivity
  const [tabsMap, { mutate }] = createResource(async () => {
    const t = await browserApi.listAllTabs()
    return t.reduce((acc, curr) => {
      return { ...acc, [curr.id]: curr }
    }, {})
  }, {
    initialValue: {},
  })

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("tab:", tab)
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
        // setTabsMap(produce(t => {
        //   t[tabId].pinned = !t[tabId].pinned;
        // }));
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
        // setTabsMap(produce(t => {
        //   t[tabId].mutedInfo.muted = !t[tabId].mutedInfo.muted;
        // }));
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
          // mutate(produce(t => { delete t[tabId] }));
        })
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

          <div class="text-medium text-2xl dark:text-gray-200">Tabs ({Object.keys(tabsMap()).length})</div>
          <For each={matchedTabs()}>
            {(tabId, idx) => (
              <Tab
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

          {/* <div class="text-medium text-2xl dark:text-gray-200">Commands</div> */}
          {/* <For each={Object.keys(browserCommands)}> */}
          {/*   {(command, idx) => ( */}
          {/*     <TabItem */}
          {/*       // isSelected={activeMatch() === idx()} */}
          {/*       label={command} */}
          {/*       onClick={() => { */}
          {/*         (async () => { */}
          {/*           await browserCommands[command]() */}
          {/*         })(); */}
          {/*       }} */}
          {/*     /> */}
          {/*   )} */}
          {/* </For> */}
        </div>
      </div>
    </div>
  );
}

export default App;
