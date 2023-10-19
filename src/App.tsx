import { createResource, createSignal, For, type Component, type Ref, Switch, Match, createEffect, batch, type Accessor } from 'solid-js'
import { browserApi } from './webext-apis/browser-api'
import * as browser from 'webextension-polyfill'
import { PageRoot } from './components/page'
import { TextField } from './components/inputs'
import { BrowserTab } from './components/browser-tab'
import { PowerlineIcon } from './components/icons'
import { fuzzyFind } from './pkg/fuzzy/fuzzy-finder'
import { createStore, produce } from 'solid-js/store'
import { musicControls } from './webext-apis/music-controls'

interface Tabs {
  list: number[]
  // data: Map<number, browser.Tabs.Tab>
  data: Record<number, browser.Tabs.Tab & { idx?: number }>
}

const DEFAULT_EMPTY_TABS: Tabs = { list: [] as number[], data: {} satisfies Record<number, browser.Tabs.Tab> }

interface MatchAttrs { key: string, value: string, indices?: number[][] }

type MatchedTabs = Tabs & { matches: Record<number, MatchAttrs[]> }

const DEFAULT_MATCH_ATTRS: MatchAttrs = { key: '', value: '', indices: [] as number[][] }

const DEFAULT_EMPTY_MATCHED_TABS: MatchedTabs = { ...DEFAULT_EMPTY_TABS, matches: {} satisfies Record<number, MatchAttrs[]> }

type Marks = Record<string, number>
const DEFAULT_EMPTY_MARKS: Marks = {} satisfies Marks

type TabToMarks = Record<number, string>

interface QueryTextFieldArgs {
  ref?: Ref<HTMLInputElement>
  value: string
  setValue: (value: string) => void
  placeholder: string
  disabled?: boolean
  class?: string
}

const QueryTextField: Component<QueryTextFieldArgs> = (props: QueryTextFieldArgs) => {
  return <TextField
    value={props.value}
    ref={props.ref}
    setValue={(v) => { props.setValue(v) }}
    placeholder={props.placeholder}
    autofocus
    disabled={props.disabled}
    class={`bg-slate-100 dark:bg-slate-900 dark:text-blue-50 rounded-r-md w-full px-4 py-2 text-lg leading-4 tracking-wider outline-none focus:outline-none border-none ring-0 focus:ring-0 flex-1 placeholder:font-bold placeholder:text-lg ${props.class ?? ''}`}
  />
}

enum Mode {
  Search = 0,
  Action = 1,
  Group = 2,
  Marks = 3,
}

function placeholderForMode(m: Mode): string {
  switch (m) {
    case Mode.Search:
      return 'Search Your Tabs'
    case Mode.Action:
      return 'Act on Your Tabs'
    case Mode.Group:
      return 'Perform Grouped Actions on Tab, like closing them all with <Ctrl-d>'
    case Mode.Marks:
      return 'Jumps to Marks'
  }
}

function isExtensionTab(tab: browser.Tabs.Tab): boolean {
  return tab.url?.startsWith(browser.runtime.getURL('')) ?? false
}

export default function App() {
  const fetchListOfTabs = async (): Promise<Tabs> => {
    const t = await browserApi.listAllTabs()

    let tIdx = 0
    const t2 = t
      .filter(item => item.url !== browser.runtime.getURL('src/background.html'))
      .reduce((acc, curr) => {
        if (isExtensionTab(curr)) {
          logger.info('skipping background page', { url: curr.url })
          return acc
        }
        tIdx += 1

        return {
          list: [...acc.list, Number(curr.id)],
          data: { ...acc.data, [Number(curr.id)]: { ...curr, idx: tIdx } },
        }
      }, DEFAULT_EMPTY_TABS)

    return t2
  }

  const [tabs, { mutate: mutateTabs }] = createResource<Tabs>(fetchListOfTabs, { initialValue: { list: [], data: {} }, name: 'fetching list of tabs' })

  const setTabs = (f: (argTabs: Tabs) => void) => {
    mutateTabs(t => {
      f(t)
      return { ...t }
    })
  }

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    logger.debug('listened for onUpdated', { tabId, changeInfo, tab })
    setTabs((d) => {
      if (tabId != null && tab.status === 'complete') {
        if (isExtensionTab(tab)) {
          return
        }
        if (!(tabId in d.data)) {
          d.list.push(tabId)
        }
        d.data[tabId] = tab
      }
    })
  })

  browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    logger.debug('listened for onRemoved', { tabId, removeInfo })
    setTabs((d) => {
      d.list = d.list.filter(id => id !== tabId)
      delete (d.data[tabId])
    })
  })

  const [query, setQuery] = createStore<string[]>(['', '', '', ''])

  async function fetchMarks(): Promise<Marks> {
    const v = await browserApi.localStore.get<Marks>('tabs-vim-marks')
    if (v == null) {
      return DEFAULT_EMPTY_MARKS
    }

    return v
  }

  const [marks, { mutate: setMarks }] = createResource<Marks>(fetchMarks, { initialValue: {} satisfies Marks, name: 'marks' })

  const tabToMarks: Accessor<TabToMarks> = () => Object.entries(marks())
    .filter(([_, tabId]) => !tabs().data[tabId]?.url?.startsWith('moz-extension://'))
    .reduce((acc, [mark, tabId]) => {
      return { ...acc, [tabId]: mark }
    }, {} satisfies TabToMarks)

  createEffect(() => {
    const lMarks = marks()
    if (Object.keys(lMarks).length === 0) {
      return
    }
    void (async () => {
      await browserApi.localStore.set('tabs-vim-marks', lMarks)
      logger.debug('persisted marks into local-storage', { marks: lMarks })
    })()
  })

  const [mode, setMode] = createSignal<Mode>(Mode.Search)

  createEffect(() => {
    if (mode() === Mode.Search && query[Mode.Search].startsWith('`')) {
      batch(() => {
        setMode(Mode.Marks)
        setQuery(produce(q => {
          q[Mode.Marks] = query[Mode.Search]
          q[Mode.Search] = ''
        }))
      })
    }
  })

  createEffect(() => {
    if (mode() !== Mode.Marks) {
      return null
    }

    if (query[Mode.Marks].length === 0) {
      setMode(Mode.Search)
    }

    // trying to check whether mark is begin accessed
    if (query[Mode.Marks].length === 2 && query[Mode.Marks][0] === '`') {
      const mark = query[Mode.Marks][1]
      void (async () => {
        await browser.tabs.update(marks()[mark], { active: true })
        setQuery(produce(q => {
          q[Mode.Marks] = ''
        }))
      })()
    }
  })

  const matchedTabs = (): MatchedTabs => {
    if (mode() === Mode.Marks) {
      const tabIds = Object.keys(tabToMarks()).map(Number).filter(tabId => tabId in tabs().data)
      const x = {
        list: tabIds,
        data: tabIds.reduce((acc, curr) => {
          return { ...acc, [curr]: tabs().data[curr] }
        }, {}),
        matches: {},
      }
      logger.info('matchedTabs', { x })
      return x
    }

    // search mode
    if (query[Mode.Search].length === 0) {
      return {
        list: tabs().list,
        data: tabs().data,
        matches: {},
      }
    }

    const m = fuzzyFind(Object.values(tabs().data), query[Mode.Search], {
      searchOnKeys: ['title', 'url'],
    })

    if (m == null || m?.length === 0) {
      return DEFAULT_EMPTY_MATCHED_TABS
    }

    return m.reduce((acc, curr) => {
      const matches = curr.matches?.map(item => {
        return {
          key: item.key ?? '',
          value: item.value ?? '',
          indices: item.indices.map(x => {
            return [x[0], x[1]]
          }),
        }
      })

      return {
        list: [...acc.list, Number(curr.item.id)],
        data: { ...acc.data, [Number(curr.item.id)]: curr.item },
        matches: { ...acc.matches, [Number(curr.item.id)]: matches ?? [DEFAULT_MATCH_ATTRS] },
      }
    }, DEFAULT_EMPTY_MATCHED_TABS)
  }

  const [activeSelection, setActiveSelection] = createSignal(0)

  function groupAction(event: KeyboardEvent) {
    if (mode() !== Mode.Group) {
      return
    }

    if (event.ctrlKey && event.key === 'd') {
      event.preventDefault()
      const tabIds = matchedTabs().list
      logger.info('going to close tabs', { tabIds })
      void (async () => {
        await browser.tabs.remove(tabIds)
      })()

      batch(() => {
        setQuery(produce(q => {
          q[Mode.Group] = ''
          q[Mode.Search] = ''
        }))

        setMode(Mode.Search)
        logger.debug('mode: ', { mode: mode() })
      })
    }
  }

  function searchActions(event: KeyboardEvent) {
    if (mode() !== Mode.Search) {
      return
    }

    if (event.ctrlKey && event.key === 'x') {
      event.preventDefault()
      setMode(v => {
        if (v === Mode.Group) {
          return Mode.Search
        }
        return Mode.Group
      })
    }

    if (event.ctrlKey && event.key === 'd') {
      event.preventDefault()
      const tabId = matchedTabs().list[activeSelection()]
      void (async () => {
        await browser.tabs.remove(tabId)
      })()
      setQuery(produce(q => {
        q[Mode.Search] = ''
      }))
    }
  }

  function musicActions(event: KeyboardEvent) {
    if (mode() !== Mode.Action) {
      return
    }

    if (event.code === 'Space' || event.code === 'ShiftLeft') {
      event.preventDefault()
      const tabId = matchedTabs().list[activeSelection()]
      void (async () => {
        await musicControls.playOrPauseSong(tabId)
      })()
      logger.info('playing or pausing song', { tabId })
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault()
      const tabId = matchedTabs().list[activeSelection()]
      void (async () => {
        const songInfo = await musicControls.nextSong(tabId)
        logger.info('playing next song', { title: songInfo?.title })
      })()
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault()
      const tabId = matchedTabs().list[activeSelection()]
      void (async () => {
        const songInfo = await musicControls.prevSong(tabId)
        logger.info('playing prev song', { title: songInfo?.title })
      })()
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    // mode switching
    if (event.key === 'Escape') {
      event.preventDefault()
      setMode(Mode.Search)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      setMode(v => {
        if (v >= Mode.Group) {
          return Mode.Search
        }
        return v + 1
      })
      return
    }

    if (event.key === 'ArrowUp') {
      setActiveSelection((idx) => idx - 1)
      return
    }

    if (event.key === 'ArrowDown') {
      setActiveSelection((idx) => idx + 1)
    }

    searchActions(event)
    groupAction(event)
    musicActions(event)
  }

  createEffect(() => {
    if (activeSelection() < 0) {
      setActiveSelection(matchedTabs().list.length - 1)
    }
    if (activeSelection() >= matchedTabs().list.length) {
      setActiveSelection(0)
    }
  })

  createEffect((prevQuery) => {
    if (prevQuery !== query[Mode.Search]) {
      setActiveSelection(0)
    }
  })

  createEffect(() => {
    if (mode() === Mode.Action && query[mode()].length === 2 && query[mode()].startsWith('m')) {
      const mark = query[Mode.Action][1]
      const tabId = matchedTabs().list[activeSelection()]
      if (tabId != null) {
        batch(() => {
          setQuery(produce(q => {
            q[Mode.Action] = ''
          }))
          setMarks((m) => {
            return { ...m, [mark]: tabId }
          })
          setMode(Mode.Search)
        })
      }
    }

    if (mode() === Mode.Action && query[mode()].length === 2 && query[mode()].startsWith('d')) {
      const mark = query[Mode.Action][1]
      const tabId = matchedTabs().list[activeSelection()]
      if (tabId != null) {
        batch(() => {
          setQuery(produce(q => {
            q[Mode.Action] = ''
          }))
          setMarks((m) => {
            delete m[mark]
            return { ...m }
          })
          setMode(Mode.Search)
        })
      }
    }
  })

  let inputRef: Ref<any>
  setInterval(() => {
    // HACK: this is a hack to make sure that the input is always focused
    if ((Boolean(inputRef)) && inputRef.current !== document.activeElement) {
      inputRef.focus()
    }
  })

  return <PageRoot>
    <div class="px-16 py-6 h-full flex-1 flex flex-col gap-3 dark:bg-slate-800">
      <form
        onKeyDown={onKeyDown}
        onSubmit={(e) => {
          e.preventDefault()
          const tabId = matchedTabs().list[activeSelection()]
          void (async () => {
            await browser.tabs.update(tabId, { active: true })
          })()
          batch(() => {
            setQuery(produce(q => {
              q[mode()] = ''
            }))
          })
        }}
      >
        <Switch
          fallback={
            <QueryTextField
              ref={inputRef}
              value={query[mode()]}
              setValue={(v) => {
                setQuery(produce(q => {
                  q[mode()] = v
                }))
              }}
              placeholder={placeholderForMode(mode())}
              class="rounded-l-md"
            />}
        >
          <Match when={mode() === Mode.Action}>
            <div class="flex flex-row">
              <div class="relative flex">
                <div class="bg-slate-700 pl-4 pr-1 flex items-center">
                  <div class="text-lg text-slate-500 font-bold scale-110 tracking-wide">Action</div>
                </div>
                <PowerlineIcon class="w-5 h-full fill-slate-700 dark:bg-slate-900" />
              </div>

              <QueryTextField
                ref={inputRef}
                value={query[mode()]}
                setValue={(v) => {
                  setQuery(produce(q => {
                    q[mode()] = v
                  }))
                }}
                placeholder={placeholderForMode(mode())}
              />
            </div>
          </Match>

          <Match when={mode() === Mode.Group}>
            <div class="flex flex-row">
              <div class="relative flex">
                <div class="bg-slate-700 pl-4 pr-1 flex items-center">
                  <div class="text-lg text-slate-500 font-bold scale-110 tracking-wide">Group Filter</div>
                </div>
                <PowerlineIcon class="w-5 h-full fill-slate-700 dark:bg-slate-900" />
              </div>

              <QueryTextField
                ref={inputRef}
                value={query[mode()]}
                setValue={(v) => {
                  setQuery(produce(q => {
                    q[mode()] = v
                  }))
                }}
                placeholder={placeholderForMode(mode())}
              />
            </div>
          </Match>
        </Switch>
      </form>

      <div class="text-medium text-2xl dark:text-gray-200">Tabs ({matchedTabs().list.length || 0}/{tabs().list.length})</div>

      <div class="overflow-x-visible flex-1 relative">
        <div class="overflow-y-auto flex flex-col gap-2">
          <For each={matchedTabs().list}>
            {(tabId, idx) => {
              return <BrowserTab
                index={idx() + 1}
                vimMark={tabToMarks()?.[tabId]}
                tabInfo={tabs().data[tabId]}
                isSelected={activeSelection() === idx()}
                matches={matchedTabs()?.matches[tabId]}
                onClick={() => {
                  void (async () => {
                    await browser.tabs.update(tabId, { active: true })
                  })()
                }}
              />
            }}
          </For >
        </div>
      </div>
    </div>

  </PageRoot >
}
