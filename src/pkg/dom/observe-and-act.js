export function observeAndAct(action) {
	const observer = new MutationObserver(() => {
		observer.disconnect();
		console.debug("observer disconnected");
		action();
		setTimeout(() => {
			console.debug("observer reconnected");
			observer.observe(document.body, {
				subtree: true,
				childList: true,
			});
		}, 200);
	});

	observer.observe(document.body, {
		subtree: true,
		childList: true,
	});

	return observer;
}
