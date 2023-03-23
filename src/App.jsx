import {
  createSignal, createResource, For, Show
} from 'solid-js';
import Fuse from 'fuse.js';
import { Tab } from './components/tab';

function App() {
  // const [tabs, setTabs] = createSignal(window.tabs)
  // const [url, setUrl] = createSignal('http://localhost:3000/index.html')
  const [data] = createResource(async () => {
    const tabs = await browser.tabs.query({});
    return tabs;
    // return dummyTabs
  });

  const [matchedTabs, setMatchedTabs] = createSignal([]);

  const [query, setQuery] = createSignal('');

  const [activeMatch, setActiveMatch] = createSignal(0);

  function onKeyDown(event) {
    // eslint-disable-next-line default-case
    switch (event.key) {
      case 'ArrowDown': {
        setActiveMatch((am) => am + 1);
        return;
      }
      case 'ArrowUp': {
        setActiveMatch((am) => am - 1);
      }
    }
  }

  return (
    <div class="container mx-auto p-6">
      <div class="flex flex-col gap-4" onKeyDown={onKeyDown}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const m = matchedTabs()[activeMatch()].item;
          await browser.tabs.update(m.id, { active: true });
          await browser.windows.remove(browser.windows.WINDOW_ID_CURRENT);
        }}
        >
          <input
            ref={(el) => setTimeout(() => el.focus())}
            type="text"
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
          // onChange={(e => {
          //   setQuery(e.target.value)
          //   const f = new Fuse(data() || [], { keys: ["title"] })
          //   const results = f.search(e.target.value)
          //   setMatchedTabs(results)
          //   console.log(results)
          // })}
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
