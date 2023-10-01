import * as browser from 'webextension-polyfill'

interface MusicControls {
  nextSong: (tabId: number) => Promise<any>
  prevSong: (tabId: number) => Promise<any>
  playOrPauseSong: (tabId: number) => Promise<any>
  getSongInfo: (tabId: number) => Promise<any>
}

const nextSong = async (tabId: number) => {
  return await browser.tabs.sendMessage(tabId, { method: 'next' })
}

const prevSong = async (tabId: number) => {
  return await browser.tabs.sendMessage(tabId, { method: 'prev' })
}

const pauseSong = async (tabId: number) => {
  return await browser.tabs.sendMessage(tabId, { method: 'pause' })
}

const getSongInfo = async (tabId: number) => {
  return await browser.tabs.sendMessage(tabId, { method: 'song-info' })
}

export const musicControls: MusicControls = {
  nextSong,
  prevSong,
  playOrPauseSong: pauseSong,
  getSongInfo,
}
