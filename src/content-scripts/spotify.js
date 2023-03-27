const previousSong = () => {
  document.querySelector("div.player-controls__left button[aria-label='Previous']").click()
}
const nextSong = () => {
  document.querySelector("div.player-controls__right button[aria-label='Next']").click()
}

console.log("hello from spotify content script")
document.body.style = "background: red";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("sender:", sender)
  if (request.method == 'next') {
    nextSong()
    return
  }

  if (request.method == "prev") {
    previousSong()
    return
  }
});
