import * as browser from 'webextension-polyfill'

export type TabId = number
export type TabData = browser.Tabs.Tab & { index: number }

export interface TabsCollection {
  list: TabId[]
  data: Record<number, TabData>
}

export interface TabMarks {
  marksToTab: Record<string, { tabId: number, prefixUrl: string }>
  tabToMarks: Record<number, { mark: string, prefixUrl: string }>
}

