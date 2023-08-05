import * as browser from "webextension-polyfill";

const url = browser.runtime.getURL('src/background.html');

async function listTabs() {
  return browser.tabs.query({
    currentWindow: true,
    pinned: true,
    url: url,
  })
}

async function ensureExtensionTab() {
  const t = await listTabs()
  if (t.length == 0) {
    const extensionTab = await browser.tabs.create({
      active: false,
      url: url,
      pinned: true,
    })

    return extensionTab.id
  }

  return t[0].id
}

async function ensurePreviousTabId(tabId) {
  const [currTab] = await browser.tabs.query({ active: true })

  let gotoId = tabId
  const tabs = await listTabs()
  for (let i = 0; i < tabs.length; i++) {
    // console.log(`tab[i].id: ${tabs[i].id} tabId: ${tabId}`)
    if (tabs[i].id == tabId) {
      return tabId
    }
    if (tabs[i].id == currTab.id) {
      continue
    }
    gotoId = tabs[i].id
  }

  return gotoId
}

(async () => {
  try {
    const extensionTabId = await ensureExtensionTab()

    let prevTabId = null
    const toggleTab = async () => {
      try {
        const [currTab] = await browser.tabs.query({ active: true })
        // console.debug(`current tab id: ${currTab.id} extension tab id (${extensionTabId}) prev tab id: ${prevTabId}`)
        if (currTab.id === extensionTabId) {
          const gotoId = await ensurePreviousTabId(prevTabId)
          return browser.tabs.update(gotoId, { active: true })
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

    // browser.commands.onCommand.addListener(toggleTab)
    browser.commands.onCommand.addListener((command) => {
      if (command === "control-center") {
        toggleTab()
      }
    })
    // browser.browserAction.onClicked.addListener(toggleTab)
  } catch (err) {
    console.error("[err]: ", err)
  }
})()
