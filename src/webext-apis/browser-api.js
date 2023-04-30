export const browserApi = {}

browserApi.listAllTabs = async () => {
  return browser.tabs.query({})
};

browserApi.areTabsEqual = (prev, next) => {
  if (prev?.id != next?.id) {
    return false
  }

  if (prev?.pinned != next?.pinned) {
    return false
  }

  if (prev?.mutedInfo?.muted != next?.mutedInfo?.muted) {
    return false
  }

  if (prev?.title != next?.title) {
    return false
  }

  if (prev?.url != next?.url) {
    return false
  }
  return true
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
