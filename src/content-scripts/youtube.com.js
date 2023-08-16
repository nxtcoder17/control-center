console.log('[control-center] youtube content script loaded')

const YOUTUBE_SHORTS_SELECTOR = '[is-shorts]'
const THUMBNAIL_IMAGES_SELECTOR = '#content #thumbnail img'

function observeAndAct (action) {
  action()
  const observer = new MutationObserver(action)

  observer.observe(document.body, {
    subtree: true,
    childList: true,
  })
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

function hideImages (selector = THUMBNAIL_IMAGES_SELECTOR) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found these many images, hiding them', items.length)
    items.forEach(i => i.style.visibility = 'hidden')
  }
}

function showImages (selector) {
  const items = document.querySelectorAll(selector)
  if (items.length > 0) {
    console.log('[control-center] found these many images, showing them', items.length)
    items.forEach(i => i.style.visibility = 'visible')
  }
}

function addButtonOnYoutubeMastHead (element) {
  const container = document.querySelector('#container #end')
  container.insertBefore(element, container.firstChild)
}

const box = document.createElement('img')
// box.innerText = "👁 toggle thumbnails"

// const iconHideImage= "https://github.com/kloudlite/api/assets/22402557/d498768c-f27b-42ac-85cd-a25b076ad8e1"
const iconHideImage = 'https://i.ibb.co/c30ZCy8/no-image.png'
// const iconShowImage = "https://github.com/kloudlite/api/assets/22402557/6c4d5fd1-002c-437a-be15-dbdf48d3df31"
const iconShowImage = 'https://i.ibb.co/NrZfWzJ/show-image.png'

// const url = browser.runtime.getURL('icons/no-picture.png');
// box.src="https://img.icons8.com/?size=512&id=circdDLDm1Qi&format=png"
box.src = iconHideImage
box.style = 'width: 32px; height: 32px; border-radius: 10%; padding: 2px; cursor: pointer;'
box.setAttribute('thumbnails-hidden', 'true')
box.setAttribute('controlled-by', 'control-center')
box.onclick = () => {
  if (box.getAttribute('thumbnails-hidden') === 'true') {
    showImages(THUMBNAIL_IMAGES_SELECTOR)
    box.src = iconShowImage
    box.setAttribute('thumbnails-hidden', 'false')
    return
  }
  box.src = iconHideImage
  box.setAttribute('thumbnails-hidden', 'true')
  hideImages(THUMBNAIL_IMAGES_SELECTOR)
}
addButtonOnYoutubeMastHead(box)

observeAndAct(() => {
  blockYoutubeShorts(YOUTUBE_SHORTS_SELECTOR)

  if (box.getAttribute('thumbnails-hidden') === 'true') {
    console.log('[control-center] hiding images')
    hideImages(THUMBNAIL_IMAGES_SELECTOR)
  }
})
