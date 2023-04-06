
const url = browser.runtime.getURL('dist/public/background.html')
console.log("here from backgroud.js");

(async () => {
  try {
    const extensionTab = await browser.tabs.create({
      active: false,
      index: 1,
      url: url,
      pinned: true,
    })
    const extensionTabId = extensionTab.id

    let prevTabId = null
    const toggleTab = async () => {
      try {
        const [currTab] = await browser.tabs.query({ active: true })
        // console.log("extension tabId:", extensionTabId)
        // console.log("currTab.id === extensionTabId && prevTabId", currTab.id === extensionTabId, prevTabId)

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
