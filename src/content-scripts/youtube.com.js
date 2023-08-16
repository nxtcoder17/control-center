console.log('[control-center] youtube content script loaded')

const YOUTUBE_SHORTS_SELECTOR = '[is-shorts]'
const THUMBNAIL_IMAGES_SELECTOR = '#content #thumbnail img'

const LABEL_SHOW_THUMBNAILS = 'show-thumbnails'
const VALUE_SHOW_THUMBNAILS = 'true'
const VALUE_HIDE_THUMBNAILS = 'false'

function observeAndAct (action) {
  action()
  const observer = new MutationObserver(action)

  observer.observe(document.body, {
    subtree: true,
    childList: true,
  })

  // observer.disconnect()
  return observer
}

function blockYoutubeShorts (selector = YOUTUBE_SHORTS_SELECTOR) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found these youtube shorts, removing them', items)
    items.forEach(item => {
      item.remove()
    })
  }
}

observeAndAct(() => {
  blockYoutubeShorts(YOUTUBE_SHORTS_SELECTOR)
})

function hideImages (selector) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found these many images, hiding them', items.length)
    items.forEach(i => {
      i.style.visibility = 'hidden'
    })
  }
}

function showImages (selector) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found these many images, showing them', items.length)
    items.forEach(i => {
      i.style.visibility = 'visible'
    })
  }
}

function observeAndHideThumbnails () {
  let observer = null

  const observe = () => {
    if (observer != null) {
      observer.disconnect()
    }
    observer = observeAndAct(() => {
      console.log('[control-center] hiding images')
      hideImages(THUMBNAIL_IMAGES_SELECTOR)
    })
  }

  const stop = () => {
    observer.disconnect()
    observer = null
  }

  return { observe, stop }
}

const thumbnailsObserver = observeAndHideThumbnails()

function addButtonOnYoutubeMastHead (element) {
  const container = document.querySelector('#container #end')
  container.insertBefore(element, container.firstChild)
}

const box = document.createElement('img')
// box.innerText = "👁 toggle thumbnails"

const iconHideImage = 'https://i.ibb.co/c30ZCy8/no-image.png'
const iconShowImage = 'https://i.ibb.co/NrZfWzJ/show-image.png'

// const url = browser.runtime.getURL('icons/no-picture.png');
// box.src="https://img.icons8.com/?size=512&id=circdDLDm1Qi&format=png"
box.src = iconHideImage
box.style = 'width: 32px; height: 32px; border-radius: 10%; padding: 2px; cursor: pointer;'
box.setAttribute(LABEL_SHOW_THUMBNAILS, VALUE_HIDE_THUMBNAILS)
box.setAttribute('controlled-by', 'control-center')
box.onclick = () => {
  const val = box.getAttribute(LABEL_SHOW_THUMBNAILS)
  if (val === VALUE_HIDE_THUMBNAILS) {
    box.setAttribute(LABEL_SHOW_THUMBNAILS, VALUE_SHOW_THUMBNAILS)
    box.src = iconShowImage
    showImages(THUMBNAIL_IMAGES_SELECTOR)
    thumbnailsObserver.disconnect()
    return
  }

  box.setAttribute(LABEL_SHOW_THUMBNAILS, VALUE_HIDE_THUMBNAILS)
  box.src = iconHideImage
  hideImages(THUMBNAIL_IMAGES_SELECTOR)
  thumbnailsObserver.observe()
}
addButtonOnYoutubeMastHead(box)

thumbnailsObserver.observe()
