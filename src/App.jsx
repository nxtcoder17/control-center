import { produce } from "immer";
import { For, createResource, createSignal, createComputed, onCleanup, onMount, createEffect } from "solid-js";

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
  let timer = setInterval(() => {
    refetch()
  }, 500)
  onCleanup(() => clearInterval(timer))


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

  // const [activeMatchRef, setActiveMatchRef] = createSignal(null);
  // createEffect(() => {
  //   if (activeMatchRef()) {
  //     console.log("activeMatchRef:", activeMatchRef())
  //     activeMatchRef().scrollIntoView()
  //   }
  // })

  return (
    <div class="h-screen w-screen overflow-none py-4 px-4 dark:bg-slate-800" onKeyDown={onKeyDown}>
      <div class="h-full w-full overflow-auto">
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
              class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 w-full px-4 py-2 text-lg leading-4 tracking-wider focus:outline-none sticky"
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
