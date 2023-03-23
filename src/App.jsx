import {
  createSignal, createResource, For, Show, createEffect
} from 'solid-js';
import Fuse from 'fuse.js';
import { Tab } from './components/tab';
import { dummyTabs } from './dummy-tabs'

function App() {
  // const [tabs, setTabs] = createSignal(window.tabs)
  // const [url, setUrl] = createSignal('http://localhost:3000/index.html')
  const [data] = createResource(async () => {
    const tabs = await browser.tabs.query({});
    return tabs;
    // return dummyTabs;
  });

  const [matchedTabs, setMatchedTabs] = createSignal([]);

  const [query, setQuery] = createSignal('');

  const [activeMatch, setActiveMatch] = createSignal(0);

  async function pinThisTab(tabId) {
    const tab = await browser.tabs.get(tabId)
    await browser.tabs.update(tabId, {
      pinned: !tab.pinned,
    })
  }

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
      console.log("this tab should be pinned")
      const m = matchedTabs()[activeMatch()].item;
      (async () => {
        await pinThisTab(m.id)
      })()
      return
    }
  }

  return (
    <div class="container mx-auto p-6" onKeyDown={onKeyDown}>
      <div>current active match: {activeMatch()}</div>
      <div class="flex flex-col gap-4">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const m = matchedTabs()[activeMatch()].item;
          await browser.tabs.update(m.id, { active: true });
          await browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
        }}
        >
          <input
            type="text"
            autoFocus
            placeholder="Search Your Tabs"
            value={query()}
            class="h-8 bg-slate-100 w-full px-4 py-6 text-lg leading-10 tracking-wider focus:outline-none"
            onInput={(e) => {
              setQuery(e.target.value);
              const f = new Fuse(data() || [], {
                keys: ['title', 'url'],
                includeScore: true,
                useExtendedSearch: true,
              });
              const results = f.search(e.target.value);
              setMatchedTabs(results);
              console.log(results);
            }}
          />
        </form>

        {/* <div>matched tabs: {matchedTabs().length}</div> */}
        <For each={matchedTabs()}>
          {(item, idx) => (
            <Tab
              {...item.item}
              isSelected={activeMatch() === idx()}
              onClick={() => {
                (async () => {
                  await browser.tabs.update(item.item.id, { active: true });
                })();
              }}
            />
          )}
        </For>

        <Show when={query().length === 0}>
          <For each={data()}>
            {(item, idx) => (
              <Tab
                {...item}
                isSelected={activeMatch() === idx()}
                onClick={() => {
                  (async () => {
                    await browser.tabs.update(item.id, { active: true });
                  })();
                }}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}

export default App;
