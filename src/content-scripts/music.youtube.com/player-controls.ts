import * as browser from "webextension-polyfill";

const getPlayerBar = () => {
	return document.querySelector("ytmusic-player-bar");
};

const readSongInfo = async () => {
	return await new Promise((resolve, reject) => {
		setTimeout(() => {
			const songInfo = getPlayerBar().querySelectorAll(
				"yt-formatted-string.title, yt-formatted-string.byline",
			);
			if (songInfo.length === 0) {
				reject(new Error("song info not found"));
				return;
			}
			resolve({ title: songInfo[0]?.title, byline: songInfo[1]?.title });
		}, 100);
	});
};

const previousSong = async () => {
	getPlayerBar()
		.querySelector(".left-controls-buttons .previous-button")
		.click();
	return await readSongInfo();
};

const nextSong = async () => {
	getPlayerBar().querySelector(".left-controls-buttons .next-button").click();
	return await readSongInfo();
};

const pauseSong = async () => {
	getPlayerBar()
		.querySelector(".left-controls-buttons .play-pause-button")
		.click();
	return await readSongInfo();
};

const actionsMap = {
	pause: pauseSong,
	next: nextSong,
	prev: previousSong,
	"song-info": readSongInfo,
};

console.log("[control-center] youtube music content script loaded");

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) {
browser.runtime.onMessage.addListener((request) => {
	if (!(request.method in actionsMap)) {
		return Promise.reject(
			new Error(
				`Invalid method ${request.method}, only pause,next,prev,song-info supported`,
			),
		);
	}

	return actionsMap[request.method]();
});
