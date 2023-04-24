const url = browser.runtime.getURL('src/background.html');

(async () => {
  try {
    const t = await browser.tabs.query({
      currentWindow: true,
      pinned: true,
      url: url,
    })

    const extensionTabId = await (async () => {
      if (t.length == 0) {
        const extensionTab = await browser.tabs.create({
          active: false,
          url: url,
          pinned: true,
        })

        return extensionTab.id
      }

      return t[0].id
    })()

    console.log("extension tabId: ", extensionTabId)

    let prevTabId = null
    const toggleTab = async () => {
      try {
        const [currTab] = await browser.tabs.query({ active: true })
        if (currTab.id === extensionTabId && prevTabId) {
          return browser.tabs.update(prevTabId, { active: true })
        }

        prevTabId = currTab.id
        await browser.tabs.update(extensionTabId, {
          active: true,
          openerTabId: prevTabId,
        })
      } catch (err) {
        console.error("[ERR]:", err)
      }
    }

    browser.commands.onCommand.addListener(toggleTab)
    browser.browserAction.onClicked.addListener(toggleTab)
  } catch (err) {
    console.error("[err]: ", err)
  }
})()
