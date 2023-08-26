import { produce } from 'immer'
import { batch, createSignal, createMemo, createEffect, createResource, For } from 'solid-js'
import { type Ref } from 'solid-js';
import * as browser from 'webextension-polyfill'

import { type TabsCollection, type TabData, type TabId, type TabMarks } from './types'

import { browserApi } from './webext-apis/browser-api'
import { musicControls } from './webext-apis/music-controls'

import Fuse from 'fuse.js'
import { BrowserTab } from './components/browser-tab'
import { PageRoot } from './components/page'

import { FiSettings } from 'solid-icons/fi'
import { PowerlineIcon } from './components/icons';
import { fuzzyFind } from './pkg/fuzzy/fuzzy-finder'

const DISABLE_SETTINGS_ICON = true

function proxyToObject(proxy: unknown) {
  return JSON.parse(JSON.stringify(proxy))
}

function checkIfValidMark(markUrl: string, tabUrl = '') {
  if (markUrl && tabUrl) {
    return tabUrl.startsWith(markUrl)
  }
  return false
}

function fuzzyFindTabs(tabs: TabsCollection, marks: TabMarks, query: string): TabsCollection {
  const sortPredicate = (a: any, b: any) => a.index - b.index

  if (query === '') {
    return tabs
  }

  const data = proxyToObject(tabs.data)

  if (query.startsWith('`')) {
    const bTabs = Object.keys(marks.tabToMarks).filter(i => i in data && checkIfValidMark(marks.tabToMarks[Number(i)].prefixUrl, data[i]?.url)).map(tabId => {
      const tid = Number(tabId)
      return {
        ...tabs.data[tid],
        cc_extras: { ...marks.tabToMarks[tid], mark: '`' + marks.tabToMarks[tid].mark },
      }
    })

    const qt = query.slice(1).toUpperCase()
    if (qt === '') {
      return {
        list: bTabs.sort(sortPredicate).map(tab => tab.id).filter((item: number | undefined): item is number => item !== undefined),
        data: bTabs.reduce((acc, curr) => {
          if (curr.id == null) {
            return acc
          }
          // return { ...acc, [curr.id]: curr }
        }, {}),
      }
    }

    const f = new Fuse(bTabs, {
      // keys: ['cc_extras.bookmark', 'index', 'title', 'url'],
      keys: ['cc_extras.mark'],
      includeScore: false,
      includeMatches: true,
      useExtendedSearch: true,
      minMatchCharLength: 0,
    })

    const results = f.search(query.slice(1).toUpperCase())

    return {
      list: results?.sort(sortPredicate).map(result => result.item.id).filter((item: number | undefined): item is number => item !== undefined),
      data: results?.reduce((acc, curr) => {
        if (curr.item.id == null) {
          return acc
        }
        return { ...acc, [curr.item.id]: curr }
      }, {}),
    }
  }

  const f = new Fuse(Object.values(tabs.data), {
    keys: ['index', 'title', 'url'],
    includeScore: false,
    includeMatches: true,
    useExtendedSearch: true,
  })

  const results = f.search(query)

  return {
    list: results.sort(sortPredicate).map(result => result.item.id).filter((item: number | undefined): item is number => item !== undefined),
    data: results.reduce((acc, curr) => {
      if (curr.item.id == null) {
        return acc
      }
      return { ...acc, [curr.item.id]: curr }
    }, {}),
  }
}

function App() {
  // eslint-disable-next-line solid/reactivity
  const [listOfTabs, { refetch }] = createResource(async () => await browserApi.listAllTabs(), { initialValue: [] })

  const [tabs, setTabs] = createSignal<TabsCollection>({ list: [], data: {} })

  createEffect(() => {
    const t = listOfTabs()
    const _tabs = t.reduce((acc, curr) => {
      if (curr.url === browser.runtime.getURL('src/background.html')) {
        return acc
      }

      curr.index = acc.index
      if (curr.id == null) {
        throw new Error("Tab doesn't have an id")
      }
      return { list: [...acc.list, curr.id], data: { ...acc.data, [curr.id]: { ...curr } }, index: acc.index + 1 }
    }, { list: [] as TabId[], data: {} satisfies Record<number, TabData>, index: 1 })

    setTabs((_prev) => {
      return {
        list: _tabs.list,
        data: _tabs.data,
      }
    })
  })

  // register browser tab events
  browser.tabs.onCreated.addListener(() => {
    Promise.resolve(refetch()).catch(err => { logger.error(err) })
  })
  browser.tabs.onUpdated.addListener(() => {
    Promise.resolve(refetch()).catch(err => { logger.error(err) })
  })
  browser.tabs.onRemoved.addListener(() => {
    Promise.resolve(refetch()).catch(err => { logger.error(err) })
  })

  const [query, setQuery] = createSignal('')
  const [actionCommand, setActionCommand] = createSignal('')

  const [activeMatch, setActiveMatch] = createSignal(0)

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
  createEffect((prev = '') => {
    const currQuery = query()
    if (prev !== currQuery) {
      setActiveMatch(0)
    }
    return currQuery
  })

  // eslint-disable-next-line solid/reactivity
  const [vimMarks, { mutate: setVimMarks }] = createResource(async () => {
    const marks = await browserApi.localStore.get<TabMarks>('tabs-vim-marks')
    logger.debug('marks-from-local-store', { 'marks-to-tab': marks?.marksToTab })

    const marksObj: TabMarks = {} as any

    marksObj.marksToTab = Object.entries(marks?.marksToTab ?? {}).filter(([_, { tabId, prefixUrl }]) => checkIfValidMark(prefixUrl, tabs().data[tabId]?.url)).reduce((acc, [mark, { tabId, prefixUrl }]) => {
      return { ...acc, [mark]: { tabId, prefixUrl } }
    }, {})

    marksObj.tabToMarks = Object.entries(marks?.marksToTab ?? {}).reduce((acc, [mark, { tabId, prefixUrl }]) => {
      return { ...acc, [tabId]: { mark, prefixUrl } }
    }, {})

    logger.debug('marks-before-validation', { marks })

    await browserApi.localStore.set('tabs-vim-marks', marks)
    return marksObj
  }, { initialValue: { tabToMarks: {}, marksToTab: {} } })

  function persistVimMarks(marksObj: TabMarks) {
    void (async () => {
      logger.debug('pre-persist-vim-marks', marksObj)
      await browserApi.localStore.set('tabs-vim-marks', marksObj)
      logger.debug('post-persist-vim-marks', { 'tab-vim-marks': await browserApi.localStore.get('tabs-vim-marks') })
    })()
  }

  createEffect(() => {
    if (query().length === 2 && query().startsWith('`')) {
      void (async () => {
        const mt = vimMarks().marksToTab
        const inputMark = query().slice(1).toUpperCase()
        if (inputMark in mt) {
          await browser.tabs.update(Number(mt[inputMark].tabId), { active: true })
        }
        setQuery('')
      })()
    }
  })

  const matchedTabs = createMemo(() => {
    return fuzzyFindTabs(tabs(), vimMarks(), query())
    // const results = fuzzyFind(Object.values(tabs().data), query())
    // const rfmt = (results || []).reduce((acc, curr) => {
    //   return {
    //     list: [...acc.list, Number(curr.item.id)],
    //     data: { ...acc.data, [Number(curr.item.id)]: curr.item },
    //   }
    // }, { list: [], data: {} })
    // return rfmt
    // return fuzzyFindTabs(tabs(), vimMarks(), query())
  })

  const [actionMode, setActionMode] = createSignal(false)
  const [groupFilter, setGroupFilter] = createSignal(false)

  async function handleMusicEvent(activeTabId: number, event: KeyboardEvent) {
    const activeUrl = tabs().data[activeTabId]?.url ?? ''
    switch (event.keyCode) {
      case 39: // right Arrow
        if (activeUrl.includes('spotify.com') || activeUrl.includes('music.youtube.com')) {
          event.preventDefault()
          return await musicControls.nextSong(activeTabId)
        }
        break
      case 37: // left Arrow
        if (activeUrl.includes('spotify.com') || activeUrl.includes('music.youtube.com')) {
          event.preventDefault()
          return await musicControls.prevSong(activeTabId)
        }
        break
      case 32: // space
        if (activeUrl.includes('spotify.com') || activeUrl.includes('music.youtube.com')) {
          event.preventDefault()
          return await musicControls.playOrPauseSong(activeTabId)
        }
        break
    }

    return false
  }

  function onKeyDown(event: KeyboardEvent) {
    void (async () => {
      const activeTabId = matchedTabs()?.list[activeMatch()]

      if (event.key === 'Tab') {
        event.preventDefault()
        setActionMode((v) => !v)
        return
      }

      if (event.ctrlKey && event.key === 'x') { // ctrl + x
        event.preventDefault()
        setGroupFilter((v) => !v)
        return
      }

      if (event.key === 'ArrowUp') {
        setActiveMatch((am) => am - 1)
        return
      }

      if (event.key === 'ArrowDown') {
        setActiveMatch((am) => am + 1)
        return
      }

      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault()
        console.log('this tab should be toggled pin/unpin')
        const tabId = matchedTabs().list[activeMatch()]
        if (tabId != null) {
          await browserApi.togglePin(tabId)
        }
        setQuery('')
        return
      }

      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault()
        return
      }

      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault()
        console.log('this tab should be toggled muted/unmute')
        const tabId = matchedTabs().list[activeMatch()]
        if (tabId) {
          await browserApi.toggleMute(tabId)
        }

        setQuery('')
        return
      }

      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault()

        if (groupFilter()) {
          const p = matchedTabs().list.map(async tabId => { await browserApi.closeTab(tabId) })
          await Promise.all(p)
          setGroupFilter(false)
          return
        }

        const tabId = matchedTabs().list[activeMatch()]
        if (tabId) {
          await browserApi.closeTab(tabId)
        }

        setQuery('')
      }

      if (actionMode()) {
        if (event.key === 'Escape') {
          setActionMode(false)
          return
        }

        if (actionCommand() === '' || actionCommand() === ' ') {
          await handleMusicEvent(activeTabId, event)
        }
      }
    })()
  }

  // create and delete marks
  createEffect(() => {
    if (actionCommand().startsWith('m') && actionCommand().length === 2) {
      const tabId = matchedTabs().list[activeMatch()]
      const newMark = actionCommand().charAt(1).toUpperCase()

      setVimMarks(produce((m) => {
        if (newMark in m.marksToTab) {
          const mObj = m.marksToTab[newMark]
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete m.marksToTab[newMark]
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete m.tabToMarks[mObj.tabId]
        }
        if (tabId in m.tabToMarks) {
          const mObj = m.tabToMarks[tabId]
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete m.tabToMarks[tabId]
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete m.marksToTab[mObj.mark]
        }

        const prefixUrl = tabs().data[tabId].url?.split('?')[0]
        m.tabToMarks[tabId] = { mark: newMark, prefixUrl }
        m.marksToTab[newMark] = { tabId, prefixUrl }

        persistVimMarks(proxyToObject(m))
      }))

      batch(() => {
        setActionCommand('')
        setQuery('')
        setActionMode(false)
      })
    }

    if (actionCommand().startsWith('d') && actionCommand().length === 2) {
      const tabId = matchedTabs().list[activeMatch()]
      setVimMarks(produce(m => {
        if (!('tabToMarks' in m)) {
          m.tabToMarks = {}
        }

        if (!('marksToTab' in m)) {
          m.marksToTab = {}
        }

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete m.tabToMarks[tabId]
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete m.marksToTab[actionCommand().charAt(1).toUpperCase()]

        persistVimMarks(proxyToObject(m))
      }))

      batch(() => {
        setActionCommand('')
        setQuery('')
        setActionMode(false)
      })
    }

    if (actionCommand() === ':del marks' || actionCommand() === ':delete marks') {
      setVimMarks(produce(m => {
        m.marksToTab = {}
        m.tabToMarks = {}

        persistVimMarks(proxyToObject(m))
      }))
      batch(() => {
        setActionCommand('')
        setQuery('')
        setActionMode(false)
      })
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
    <div class="px-16 py-6 flex-1 flex flex-col gap-3 dark:bg-slate-800" onKeyDown={onKeyDown}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const tabId = matchedTabs().list[activeMatch()]
          void (async () => {
            await browser.tabs.update(tabId, { active: true })
          })()
          batch(() => {
            setQuery('')
            setGroupFilter(false)
          })
        }}
        class="flex flex-row gap-4 sticky top-2 z-50"
      >
        <div class="focus-within:shadow-lg rounded-md w-full bg-slate-100 dark:bg-slate-900 dark:text-blue-50 flex overflow-hidden">
          {!actionMode() && <>
            {groupFilter() &&
              <div class="relative flex">
                <div class="bg-slate-700 px-4 flex items-center">
                  <div class="text-lg text-slate-500 font-bold scale-110 tracking-wide">Group Filter</div>
                </div>
                <PowerlineIcon class="absolute w-6 fill-slate-700 dark:bg-slate-900 top-0 -right-2.5" />
              </div>}

            <input
              type="text"
              ref={inputRef}
              autofocus
              placeholder={'Search Your Tabs'}
              class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 rounded-md w-full px-4 py-2 text-lg leading-4 tracking-wider outline-none focus:outline-none border-none ring-0 focus:ring-0 flex-1 placeholder:font-bold placeholder:text-lg"
              value={query()}
              onInput={(e) => {
                setQuery(e.target.value)
              }}
            />
          </>
          }

          {actionMode() && <>
            <div class="relative flex">
              <div class="bg-slate-700 px-4 flex items-center">
                <div class="text-lg text-slate-500 font-bold scale-110 tracking-wide">Action</div>
              </div>
              <PowerlineIcon class="absolute w-6 fill-slate-700 dark:bg-slate-900 top-0 -right-2.5" />
            </div>

            <input
              type="text"
              ref={inputRef}
              autofocus
              placeholder={'Trigger Your Tab Actions'}
              class="bg-slate-100 dark:bg-slate-900 dark:text-blue-50 rounded-md w-full px-4 py-2 text-lg leading-4 tracking-wider outline-none focus:outline-none border-none ring-0 focus:ring-0 flex-1 placeholder:font-bold placeholder:text-lg"
              value={actionCommand()}
              onInput={(e) => {
                setActionCommand(e.target.value)
              }}
            />
          </>}

        </div>

        <div class="flex gap-2 items-center dark:bg-slate-900 bg-slate-100 px-2 rounded-md">
          <label for={'action-mode'} class="dark:text-slate-400 tracking-tight">Action Mode</label>
          <input type="checkbox" id="action-mode" checked={actionMode()} class="leading-4 rounded-sm checked:bg-blue-400 dark:bg-slate-900" />
        </div>

        <div class="flex gap-2 place-items-center dark:bg-slate-900 bg-slate-100 px-2 rounded-md">
          <label for={'group-filter'} class="dark:text-slate-400 tracking-tight">Group Filter</label>
          <input type="checkbox" id="group-filter" checked={groupFilter()} class="leading-4 rounded-sm checked:bg-blue-400 dark:bg-slate-900" />
        </div>

        {DISABLE_SETTINGS_ICON || <button
          class="flex gap-2 items-center dark:text-slate-200 text-blue-200"
          onClick={() => {
            void (async () => {
              await browser.runtime.openOptionsPage()
            })()
          }}>
          <FiSettings class="w-5 h-5" />
        </button>}

      </form>

      <div class="text-medium text-2xl dark:text-gray-200">Tabs ({matchedTabs().list.length || 0}/{tabs().list.length})</div>

      <div class="flex flex-col gap-2 overflow-visible relative">
        <For each={matchedTabs().list}>
          {(tabId, idx) => {
            return (
              <BrowserTab
                index={tabs().data[tabId]?.index}
                vimMark={checkIfValidMark(vimMarks().tabToMarks[tabId]?.prefixUrl, matchedTabs().data[tabId]?.url) ? vimMarks().tabToMarks[tabId].mark : null}
                tabInfo={tabs().data[tabId]}
                isSelected={activeMatch() === idx()}
                // matches={matchedTabs()?.data[tabId].matches}
                onClick={() => {
                  void (async () => {
                    await browser.tabs.update(tabId, { active: true })
                  })()
                }}
              />
            )
          }}
        </For>
      </div>
    </div >
  </PageRoot>
}

export default App
