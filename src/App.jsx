import { createEffect, createSignal, createResource } from "solid-js";
import { Tab } from "./components/tab";
import Fuse from 'fuse.js'
import { dummyTabs } from "./dummy-tabs";
// import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js'

function App() {
  // const [tabs, setTabs] = createSignal(window.tabs)
  // const [url, setUrl] = createSignal('http://localhost:3000/index.html')
  const [data, { mutate, refetch }] = createResource(async () => {
    console.log("hi")
    const tabs = await browser.tabs.query({})
    console.log("[tabs]: ", tabs)
    return tabs
    // return dummyTabs
  });

  createEffect(() => {
    if (data() == null) {
      return
    }
    console.log("these are tabs: ", data())
  })

  const [matchedTabs, setMatchedTabs] = createSignal([])

  const [query, setQuery] = createSignal("")

  const [activeMatch, setActiveMatch] = createSignal(0)

  function onKeyDown(event) {
    console.log("event key: ", event.key)
    switch (event.key) {
      case 'ArrowDown': {
        setActiveMatch(am => am + 1)
        return
      }
      case 'ArrowUp': {
        setActiveMatch(am => am - 1)
        return
      }
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* <p class="text-4xl text-green-700 text-center py-20">Hello world!</p> */}
      {/* <p class="text-4xl text-green-700 text-center py-20">hello {data() && data().length}</p> */}

      <div className="flex flex-col gap-4" onKeyDown={onKeyDown} >
        <form onSubmit={async (e) => {
          e.preventDefault()
          const m = matchedTabs()[activeMatch()].item
          console.log("matched tab:", m)
          await browser.tabs.update(m.id, { active: true })
          await browser.windows.remove(browser.windows.WINDOW_ID_CURRENT)
        }}>
          <input ref={el => setTimeout(() => el.focus())} type="text" placeholder="Search Your Tabs" value={query()}
            className="h-8 bg-slate-100 w-full px-4 py-6 text-lg leading-10 tracking-wider focus:outline-none"
            onInput={e => {
              setQuery(e.target.value)
              const f = new Fuse(data() || [], {
                keys: ["title", "url"],
                includeScore: true,
                useExtendedSearch: true,
              })
              const results = f.search(e.target.value)
              setMatchedTabs(results)
              console.log(results)
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
          {(item, idx) => <Tab
            {...item.item}
            isSelected={activeMatch() == idx()}
            onClick={(e) => {
              (async () => {
                await browser.tabs.update(item.item.id, { active: true })
              })()
            }} />}
        </For>

        <Show when={query().length == 0}>
          <For each={data()}>{(item, idx) => {
            return <Tab {...item}
              isSelected={activeMatch() == idx()}
              onClick={(e) => {
                (async () => {
                  await browser.tabs.update(item.id, { active: true })
                })()
              }} />
          }

          }
          </For>
        </Show>
      </div>
    </div>
  );
}

export default App;
