console.log('[control-center] youtube content script loaded')

const YOUTUBE_SHORTS_SELECTOR = '[is-shorts]'
const ADBLOCK_POPUP_SELECTOR = '.ytd-popup-container'

function observeAndAct(action) {
  const observer = new MutationObserver(() => {
    action()
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true,
  })

  // observer.disconnect()
  return observer
}

function blockAdblockPopup(selector = ADBLOCK_POPUP_SELECTOR) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found youtube adblock popup, removing it')
    items.forEach(item => {
      item.remove()
    })
    const pauseBtn = document.querySelector('.ytp-play-button')
    console.log('[control-center] un-pausing current video')
    pauseBtn.click()
  }
}

console.log('[control-center] watching dom for blocking adblock popup')
observeAndAct(() => {
  blockAdblockPopup()
})

function blockYoutubeShorts(selector = YOUTUBE_SHORTS_SELECTOR) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found these youtube shorts, removing them', items)
    items.forEach(item => {
      item.remove()
    })
  }
}

observeAndAct(() => {
  blockYoutubeShorts()
})
