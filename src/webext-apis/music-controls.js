const nextSong = async (tabId) => {
  const msg = await browser.tabs.sendMessage(tabId, { method: 'next' });
  console.log("next-song msg: ", msg)
  return msg
}

const prevSong = async (tabId) => {
  return browser.tabs.sendMessage(tabId, { method: 'prev' });
}

const pauseSong = async (tabId) => {
  return browser.tabs.sendMessage(tabId, { method: 'pause' });
}

const getSongInfo = async (tabId) => {
  return browser.tabs.sendMessage(tabId, { method: 'song-info' });
}

export const musicControls = {
  nextSong,
  prevSong,
  pauseSong,
  getSongInfo,
}
