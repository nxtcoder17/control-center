import {
  createSignal, createResource, For, Show, createEffect, onCleanup, createComputed
} from 'solid-js';
import Fuse from 'fuse.js';
import { Tab } from './components/tab';
import { dummyTabs } from './dummy-tabs'
import { browserApi } from './webext-apis/browser-api';

function App() {
  const [tabs, { mutate, refetch }] = createResource(async () => {
    return browserApi.listAllTabs();
    // return dummyTabs;
  }, {
    initialValue: [],
  });

  const [tabsMap, setTabsMap] = createSignal({})

  createComputed(() => {
    setTabsMap(t => {
      return tabs().reduce((acc, curr) => {
        return { ...acc, [curr.id]: curr }
      }, {})
    })
  })

  const [matchedTabs, setMatchedTabs] = createSignal([]);
  const [query, setQuery] = createSignal('');
  const [activeMatch, setActiveMatch] = createSignal(0);

  async function pinThisTab(tabId) {
    const tab = await browser.tabs.get(tabId)
    await browser.tabs.update(tabId, {
      pinned: !tab.pinned,
    })
  }

  console.log("timer started")
  setTimeout(() => {
    const tabId = tabs()[0].id
    console.log("timer executing for: ", tabsMap()[tabId].title, tabsMap()[tabId].pinned)
    setTabsMap(t => {
      t[tabId].pinned = false
      return t
    })
    console.log("timer completed for:", tabsMap()[tabId].title, tabsMap()[tabId].pinned)
  }, 2000)

  function onKeyDown(event) {
    console.log("event:", event.ctrlKey, event.key)
    // eslint-disable-next-line default-case

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
        tabsMap()[tabId].pinned = !tabsMap()[tabId].pinned;
        setTabsMap(tabsMap());
        (async () => {
          await pinThisTab(tabId)
        })()
      }
      return
    }
  }

  // const getTab = (tabId) => tabsMap()[tabId];

  const t = setInterval(() => {
    console.log("interval: tabs[0].pinned", tabs()[0].pinned)
  }, 200)
  onCleanup(() => clearInterval(t))

  return <Show when={tabs().length > 0}>
    <div>pinned: {tabs()[0].pinned + ""}</div>
  </Show>;

  // return (
  //   <div class="container mx-auto p-6" onKeyDown={onKeyDown}>
  //     {/* <div>current active match: {activeMatch()}</div> */}
  //     <div class="flex flex-col gap-4">
  //       <form onSubmit={async (e) => {
  //         e.preventDefault();
  //         const tabId = matchedTabs()[activeMatch()];
  //         await browser.tabs.update(tabId, { active: true });
  //         await browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
  //       }}
  //       >
  //         <input
  //           type="text"
  //           autoFocus
  //           placeholder="Search Your Tabs"
  //           value={query()}
  //           class="h-8 bg-slate-100 w-full px-4 py-6 text-lg leading-10 tracking-wider focus:outline-none"
  //           onInput={(e) => {
  //             setQuery(e.target.value);
  //             const f = new Fuse(tabs() || [], {
  //               keys: ['title', 'url'],
  //               includeScore: true,
  //               useExtendedSearch: true,
  //             });
  //             const results = f.search(e.target.value);
  //             setMatchedTabs(results.map(result => result.item.id));
  //           }}
  //         />
  //       </form>
  //
  //       <Show when={tabs().length > 0}>
  //         <div>tab0 pinned: {`${currentTab(tabs()[0].id).pinned}`}</div>
  //       </Show>
  //       <For each={matchedTabs()}>
  //         {(tabId, idx) => (
  //           <Tab
  //             tabInfo={tabsMap()[tabId]}
  //             isSelected={activeMatch() === idx()}
  //             onClick={() => {
  //               (async () => {
  //                 await browser.tabs.update(tabId, { active: true });
  //               })();
  //             }}
  //           />
  //         )}
  //       </For>
  //
  //       {/* <For each={matchedTabs().map(i => tabsMap()[i])}> */}
  //       {/*   {(tab, idx) => ( */}
  //       {/*     <Tab */}
  //       {/*       tabInfo={tab} */}
  //       {/*       isSelected={activeMatch() === idx()} */}
  //       {/*       onClick={() => { */}
  //       {/*         (async () => { */}
  //       {/*           await browser.tabs.update(tab.id, { active: true }); */}
  //       {/*         })(); */}
  //       {/*       }} */}
  //       {/*     /> */}
  //       {/*   )} */}
  //       {/* </For> */}
  //
  //       <Show when={query().length === 0}>
  //         <For each={tabs()}>
  //           {(item, idx) => (
  //             <Tab
  //               tabInfo={item}
  //               isSelected={activeMatch() === idx()}
  //               onClick={() => {
  //                 (async () => {
  //                   await browser.tabs.update(item.id, { active: true });
  //                 })();
  //               }}
  //             />
  //           )}
  //         </For>
  //       </Show>
  //     </div>
  //   </div>
  // );
}

export default App;
