// import { Select } from 'solid-blocks';
import { createEffect, createResource, createSignal } from 'solid-js'
import { browserApi } from '../lib/webext-apis/browser-api'
import { produce } from 'solid-js/store'
// import { NxtSelect } from '../components/select';

const THEME_LIGHT: string = 'light'
const THEME_DARK: string = 'dark'

export interface Options {
  theme: string
  blockYoutubeShorts: boolean
  blockYoutubeThumbnails: boolean
}

const defaultTheme: Options = {
  theme: THEME_LIGHT,
  blockYoutubeShorts: true,
  blockYoutubeThumbnails: false,
}

export const OptionsPage = () => {
  const [options, setOptions] = createSignal<Options>(defaultTheme)
  // const [theme, setTheme] = createSignal(THEME_LIGHT)
  // const [keyboardShortcut, setKeyboardShortcut] = createSignal('Ctrl+E')
  // const [blockYoutubeShorts, setBlockYoutubeShorts] = createSignal(false)

  // eslint-disable-next-line solid/reactivity
  const [savedOptions] = createResource<null | Options>(async () => {
    const opt = await browserApi.localStore.get<Options>('options')
    logger.info('extension options', { opt })
    return opt
  })

  createEffect(() => {
    const opt = savedOptions()
    if (!opt) {
      return
    }
    setOptions(opt)
  })

  return <form class="flex flex-col gap-2 px-4 py-6" onSubmit={e => {
    e.preventDefault()

    void (async () => {
      await browserApi.localStore.set('options', options())
    })()
  }}>
    <div class="flex gap-2 items-center">
      <label for="theme-picker" class="w-80">Choose Extension Theme</label>
      <select id="theme-picker"
        class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative"
        onChange={e => {
          setOptions(produce((opt) => {
            opt.theme = e.target.value
          }))
        }}
      >
        <option value="light" selected={options().theme === THEME_LIGHT}>Light</option>
        <option value="dark" selected={options().theme === THEME_DARK}>Dark</option>
      </select>
    </div>

    <div class="flex gap-2 items-center">
      <label for="extension-shortcut" class="w-80">Toggle Extension Shortcut</label>
      <input
        disabled
        id="extension-shortcut"
        type="text" class="bg-gray-200 rounded-md checked:bg-green-500 border-none" placeholder='Ctrl+Shift+E'
      // value={keyboardShortcut().trim()}
      // onInput={e => setKeyboardShortcut(e.target.value)}
      />
    </div>

    <div class="flex gap-2 items-center">
      <label for="block-youtube-shorts" class="w-80">Block Youtube Shorts</label>
      <select id="theme-picker"
        class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative"
        onChange={e => {
          setOptions(produce((opt) => {
            opt.blockYoutubeShorts = e.target.value === 'true'
          }))
        }}
      >
        <option value={'true'} selected={options().blockYoutubeShorts}>Yes</option>
        <option value={'false'} selected={!options().blockYoutubeShorts}>No</option>
      </select>
    </div>

    <div class="flex gap-2 items-center">
      <label for="block-youtube-shorts" class="w-80">Block Youtube Thumbnails</label>
      <select id="theme-picker"
        class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative"
        onChange={e => {
          setOptions(produce((opt) => {
            opt.blockYoutubeThumbnails = e.target.value === 'true'
          }))
        }}
      >
        <option value={'true'} selected={options().blockYoutubeThumbnails}>Yes</option>
        <option value={'false'} selected={!options().blockYoutubeThumbnails}>No</option>
      </select>
    </div>

    <div class="flex gap-6">
      <button type='submit' class="bg-blue-500 hover:bg-blue-700 text-blue-100 font-bold py-1 px-3 rounded-md">Save</button>
      <button class="border border-slate-500 hover:bg-slate-600 text-slate-400 font-bold py-1 px-3 rounded-md">Cancel</button>
    </div>

  </form >
}
