export const browserApi = {}

browserApi.listAllTabs = async () => {
  return browser.tabs.query({})
};

browserApi.togglePin = async (tabId) => {
  const tab = await browser.tabs.get(tabId)
  await browser.tabs.update(tabId, {
    pinned: !tab.pinned,
  })
}

browserApi.toggleMute = async (tabId) => {
  const tab = await browser.tabs.get(tabId)
  console.log("[toggleMute]: ", tab)
  await browser.tabs.update(tabId, {
    muted: !tab.mutedInfo.muted
  })
}

browserApi.closeTab = async (tabId) => {
  return browser.tabs.remove(tabId)
}
