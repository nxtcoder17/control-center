import {
  createSignal, createResource, For, Show, createEffect, onCleanup, createComputed
} from 'solid-js';
import Fuse from 'fuse.js';
import { Tab } from './components/tab';
import { dummyTabs } from './dummy-tabs'
import { browserApi } from './webext-apis/browser-api';

function App() {
  const [tabs, setTabs] = createSignal({ title: "sample", pinned: "true" })
  const [pinned, setPinned] = createSignal(true)

  const t = setInterval(() => {
    // tabs().pinned = true
    // setTabs(tabs())
    setTabs(t => {
      return { ...t, pinned: !t.pinned }
    })
    setPinned(!pinned())
  }, 1000)
  onCleanup(() => clearInterval(t))

  const t2 = setInterval(() => {
    console.log("[update]: tabs().pinned:", tabs().pinned)
    console.log("[update]: pinned:", pinned())
  }, 500)
  onCleanup(() => clearInterval(t2))

  return <div>
    <div>tabs.pinned: {tabs()?.pinned + ""}</div>
    <div>pinned: {pinned() + ""}</div>
  </div>
}

export default App
