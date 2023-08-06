import * as browser from 'webextension-polyfill'

const url = browser.runtime.getURL('src/background.html')

async function listTabs () {
  return await browser.tabs.query({
    currentWindow: true,
    pinned: true,
    url
  })
}

async function ensureExtensionTab (): Promise<number | undefined> {
  const t = await listTabs()
  if (t.length === 0) {
    const extensionTab = await browser.tabs.create({
      active: false,
      url,
      pinned: true
    })

    return extensionTab.id
  }

  return t[0].id
}

type TabId = number | undefined

async function ensurePreviousTabId (tabId: TabId): Promise<number | undefined> {
  const [currTab] = await browser.tabs.query({ active: true })

  let gotoId = tabId
  const tabs = await listTabs()
  for (let i = 0; i < tabs.length; i++) {
    // console.log(`tab[i].id: ${tabs[i].id} tabId: ${tabId}`)
    if (tabs[i].id === tabId) {
      return tabId
    }
    if (tabs[i].id === currTab.id) {
      continue
    }
    gotoId = tabs[i].id
  }

  return gotoId
}

async function init () {
  const extensionTabId = await ensureExtensionTab()
  let prevTabId: TabId

  // eslint-disable-next-line
  const toggleTab = async () => {
    const [currTab] = await browser.tabs.query({ active: true })
    // console.debug(`current tab id: ${currTab.id} extension tab id (${extensionTabId}) prev tab id: ${prevTabId}`)
    if (currTab.id === extensionTabId) {
      const gotoId = await ensurePreviousTabId(prevTabId)
      await browser.tabs.update(gotoId, { active: true })
      return
    }

    prevTabId = currTab.id
    await browser.tabs.update(extensionTabId, {
      active: true,
      openerTabId: prevTabId
    })
  }

  browser.commands.onCommand.addListener((command) => {
    if (command === 'control-center') {
      toggleTab().catch((err) => { throw err })
    }
  })
}

init().catch((err) => {
  logger.error(err)
})
