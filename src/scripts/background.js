const url = browser.runtime.getURL('src/background.html');

(async () => {
  try {
    const extensionTab = await browser.tabs.create({
      active: false,
      url: url,
      pinned: true,
    })

    const extensionTabId = extensionTab.id

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
