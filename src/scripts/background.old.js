let windowId = ""
let tabId = ""

const togglePopup = async () => {
  const url = browser.runtime.getURL('dist/public/background.html')

  // await browser.sidebarAction.toggle()

  console.log("here");

  if (tabId) {
    try {
      await browser.tabs.hide(tabId)
    } catch (err) {
      console.log("err: ", err)
    } finally {
      tabId = ""
    }
  }
  console.log("here2");

  try {
    const newTab = await browser.tabs.create({
      active: true,
      // index: 1,
      // title: 'control center',
      url: url,
    })
    tabId = newTab.id
  } catch (err) {
    console.error(err)
  }
  console.log("here 3")


  // if (windowId) {
  //   try {
  //     await browser.windows.remove(windowId)
  //     return
  //   } catch (err) {
  //     console.error(`can not remove control center window, with windowId (${JSON.stringify(windowId)})`)
  //   } finally {
  //     windowId = ""
  //     // await storageReset("windowId")
  //   }
  // }
  //
  // try {
  //   const createdWindow = await browser.windows.create({
  //     url,
  //     focused: false,
  //     type: "popup",
  //     // type: "panel",
  //     height: 480,
  //     width: 640,
  //   })
  //   windowId = createdWindow.id
  //   // await storageSet("windowId", createdWindow.id)
  //   // console.log("here 3")
  // } catch (err) {
  //   console.log(`Error: ${err}`);
  // }
}

console.log("here from backgroud.js");

browser.commands.onCommand.addListener(togglePopup)
browser.browserAction.onClicked.addListener(togglePopup)
