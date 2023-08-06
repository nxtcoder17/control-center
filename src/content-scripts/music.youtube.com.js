const getPlayerBar = () => {
  return document.querySelector("ytmusic-player-bar")
}

const readSongInfo = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const songInfo = getPlayerBar().querySelectorAll("yt-formatted-string.title, yt-formatted-string.byline")
      if (songInfo.length == 0) {
        return reject("song info not found")
      }
      return resolve({ title: songInfo[0]?.title, byline: songInfo[1]?.title })
    }, 100)
  })
}

const previousSong = async () => {
  getPlayerBar().querySelector(".left-controls-buttons .previous-button").click()
  return readSongInfo()
}

const nextSong = async () => {
  getPlayerBar().querySelector(".left-controls-buttons .next-button").click()
  return readSongInfo()
}

const pauseSong = async () => {
  getPlayerBar().querySelector(".left-controls-buttons .play-pause-button").click()
  return readSongInfo()
}

const actionsMap = {
  "pause": pauseSong,
  "next": nextSong,
  "prev": previousSong,
  "song-info": readSongInfo,
}

console.log("[control-center] youtube music content script loaded")

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) {
chrome.runtime.onMessage.addListener((request) => {
  if (!(request.method in actionsMap)) {
    return Promise.reject(`Invalid method ${request.method}, only pause,next,prev,song-info supported`)
  }

  return actionsMap[request.method]()
});
