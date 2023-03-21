(async () => {
  const t = await browser.tabs.query();
  console.log("t:", t)
})
