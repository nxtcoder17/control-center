export const browserCommands = {
  "Extensions": async () => {
    console.log("i am here");
    return browser.tabs.create({
      url: 'about:addons',
      active: true,
    })
  },

  "Debug Addons": async () => {
    return browser.tabs.create({
      url: browser.runtime.getURL('about:debugging#/runtime/this-firefox'),
      active: true,
    })
  },
};
