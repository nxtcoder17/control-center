import { produce } from "immer";
import { Show, For, createResource, createSignal, createComputed, onCleanup, createEffect, untrack } from "solid-js";

import { Tab } from './components/tab';
import { browserApi } from "./webext-apis/browser-api";
import Fuse from 'fuse.js';
import { spotifyWebControls } from "./webext-apis/spotify-controls";

function App() {
  const [tabs, { refetch }] = createResource(async () => {
    return browserApi.listAllTabs();
  }, {
    initialValue: [],
  });

  const [tabsMap, setTabsMap] = createSignal({})
  createComputed(() => {
    setTabsMap(() => {
      return tabs().reduce((acc, curr) => {
        return { ...acc, [curr.id]: curr }
      }, {})
    })
  })

  const [matchedTabs, setMatchedTabs] = createSignal([]);
  createComputed(() => {
    setMatchedTabs(mt => {
      if (mt.length == 0) {
        return tabs().map(t => t.id)
      }
      return [...mt]
    })
  })

  const [query, setQuery] = createSignal('');
  const [activeMatch, setActiveMatch] = createSignal(0);

  let timer = setInterval(() => {
    refetch()
  }, 500)
  onCleanup(() => clearInterval(timer))


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
  }

  return (
    <div class="h-screen w-screen overflow-none" onKeyDown={onKeyDown}>
      <div class="container mx-auto p-6 h-full dark:bg-slate-800 overflow-auto">
        <div class="flex flex-col gap-2">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const tabId = matchedTabs()[activeMatch()];
            await browser.tabs.update(tabId, { active: true });
            await browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
          }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Search Your Tabs"
              value={query()}
              class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 w-full px-4 py-2 text-lg leading-4 tracking-wider focus:outline-none"
              onInput={(e) => {
                setQuery(e.target.value);
                const f = new Fuse(tabs() || [], {
                  keys: ['title', 'url'],
                  includeScore: true,
                  useExtendedSearch: true,
                });
                const results = f.search(e.target.value);
                setMatchedTabs(results.map(result => result.item.id));
              }}
            />
          </form>

          {/* <Show when={tabs().length > 0}> */}
          {/*   <div>tab0 pinned: {`${currentTab(tabs()[0].id).pinned}`}</div> */}
          {/* </Show> */}

          {/* <Show when={query().length !== 0}> */}
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
          {/* </Show> */}

          {/* <Show when={query().length === 0}> */}
          {/*   <For each={tabs()}> */}
          {/*     {(tab, idx) => ( */}
          {/*       <Tab */}
          {/*         tabInfo={tab} */}
          {/*         isSelected={activeMatch() === idx()} */}
          {/*         onClick={() => { */}
          {/*           (async () => { */}
          {/*             await browser.tabs.update(tab.id, { active: true }); */}
          {/*           })(); */}
          {/*         }} */}
          {/*       /> */}
          {/*     )} */}
          {/*   </For> */}
          {/* </Show> */}
        </div>
      </div>
    </div>
  );
}

export default App;
