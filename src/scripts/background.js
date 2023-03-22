let windowId = ""

const togglePopup = async () => {
  // const url = browser.runtime.getURL('src/browser-action/popup.html')
  // const url = browser.runtime.getURL('dist/index.html')
  // const url = browser.runtime.getURL('http://localhost:3000/index.html')
  // const url = browser.runtime.getURL('public/background.html')
  const url = browser.runtime.getURL('dist/public/background.html')

  // await browser.tabs.update(25, { active: true })

  // let windowId = ""
  // try {
  //   windowId = await storageGet("windowId")
  //   console.log("windowId:", windowId)
  // } catch (err) {
  //   console.log("ERR:", err)
  // }

  if (windowId) {
    try {
      await browser.windows.remove(windowId)
      return
    } catch (err) {
      console.error(`can not remove control center window, with windowId (${JSON.stringify(windowId)})`)
    } finally {
      windowId = ""
      // await storageReset("windowId")
    }
  }

  try {
    const createdWindow = await browser.windows.create({
      url,
      focused: false,
      type: "popup",
      height: 480,
      width: 640,
    })
    windowId = createdWindow.id
    // await storageSet("windowId", createdWindow.id)
    // console.log("here 3")
  } catch (err) {
    console.log(`Error: ${error}`);
  }
}

console.log("here from backgroud.js");

browser.commands.onCommand.addListener(togglePopup)
browser.browserAction.onClicked.addListener(togglePopup)
