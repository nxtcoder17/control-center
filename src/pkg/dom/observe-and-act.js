export function observeAndAct(action) {
	const observer = new MutationObserver(() => {
		action();
	});

	observer.observe(document.body, {
		subtree: true,
		childList: true,
	});

	return observer;
}
