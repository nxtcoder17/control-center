// import { Select } from 'solid-blocks';
import { createEffect, createResource, createSignal } from 'solid-js';
import { browserApi } from '../webext-apis/browser-api'
// import { NxtSelect } from '../components/select';

export const OptionsPage = () => {
  const [theme, setTheme] = createSignal("light")
  const [keyboardShortcut, setKeyboardShortcut] = createSignal("Ctrl+E")
  const [blockYoutubeShorts, setBlockYoutubeShorts] = createSignal(false)

  const [options] = createResource(async () => {
    return browserApi.localStore.get("options")
  })

  createEffect(() => {
    if (options() && options().theme) {
      setTheme(options().theme)
    }

    if (options() && options().keyboardShortcut) {
      setKeyboardShortcut(options().keyboardShortcut)
    }
  })

  const style = {}

  return <form class="flex flex-col gap-2 px-4 py-6" onSubmit={e => {
    e.preventDefault();

    (async () => {
      await browserApi.localStore.set("options", { theme: theme(), keyboardShortcut: keyboardShortcut(), blockYoutubeShorts: blockYoutubeShorts() })
    })()
  }}>
    <div class="flex gap-2 items-center">
      <label for="theme-picker" class="w-80">Choose Extension Theme</label>
      <select id="theme-picker"
        class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative"
        onChange={e => {
          setTheme(e.target.value)
        }}
      >
        <option value="light" selected={theme() == "light"}>Light</option>
        <option value="dark" selected={theme() == "dark"}>Dark</option>
      </select>
    </div>

    <div class="flex gap-2 items-center">
      <label for="extension-shortcut" class="w-80">Toggle Extension Shortcut</label>
      <input id="extension-shortcut" type="text" class="bg-gray-200 rounded-md checked:bg-green-500 border-none" placeholder='Ctrl+Shift+E'
        value={keyboardShortcut().trim()}
        onInput={e => setKeyboardShortcut(e.target.value)}
      />
    </div>

    <div class="flex gap-2 items-center">
      <label for="block-youtube-shorts" class="w-80">Block Youtube Shorts</label>
      <select id="theme-picker"
        class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative"
        onChange={e => {
          setBlockYoutubeShorts(e.target.value)
        }}
      >
        <option value={true} selected={blockYoutubeShorts()}>Yes</option>
        <option value={false} selected={!blockYoutubeShorts()}>No</option>
      </select>
    </div>

    <div class="flex gap-6">
      <button type='submit' class="bg-blue-500 hover:bg-blue-700 text-blue-100 font-bold py-1 px-3 rounded-md">Save</button>
      <button class="border border-slate-500 hover:bg-slate-600 text-slate-400 font-bold py-1 px-3 rounded-md">Cancel</button>
    </div>

  </form >
}
