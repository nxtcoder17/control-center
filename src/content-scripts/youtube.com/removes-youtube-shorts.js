console.log('[control-center:youtube.com] removing stuffs content script loaded')

function observeAndAct(action) {
	const observer = new MutationObserver(() => {
		action()
	})

	observer.observe(document.body, {
		subtree: true,
		childList: true,
	})

	return observer
}

function removeFromDOM(selector) {
	const items = document.querySelectorAll(selector)
	if (items.length > 0) {
		// console.log('[control-center] found these youtube shorts, removing them', items)
		items.forEach(item => {
			item.remove()
		})
	}
}

const YOUTUBE_SHORTS_SELECTOR = '[is-shorts]'
console.log(`[control-center:youtube.com] removing youtube shorts with selector: "${YOUTUBE_SHORTS_SELECTOR}"`)

observeAndAct(() => {
	removeFromDOM(YOUTUBE_SHORTS_SELECTOR)
})
