export const spotifyWebControls = {};

spotifyWebControls.nextSong = async (tabId) => {
  return chrome.tabs.sendMessage(tabId, { method: 'next' });
}

spotifyWebControls.prevSong = (tabId) => {
  return chrome.tabs.sendMessage(tabId, { method: 'prev' });
}
