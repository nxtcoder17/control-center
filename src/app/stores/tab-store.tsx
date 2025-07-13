import {
	createContext,
	useContext,
	type ParentComponent,
	createEffect,
	batch,
	createMemo,
	createSignal,
} from "solid-js";
import { createStore } from "solid-js/store";
import * as browser from "webextension-polyfill";
import { musicControls } from "../actions/music-controls";
import { browserApi } from "../../pkg/browser-api";
import { withTabs } from "../hooks/tabs";
import { type Marks, withMarks } from "../hooks/marks";
import { fuzzyFind } from "../../pkg/fuzzy/fuzzy-finder";
import type { Tab, Tabs } from "../hooks/tabs";
import type { FuseResultMatch } from "fuse.js";
import type { HLMatchMeta, HLText } from "./types";
import * as perf from "../../pkg/perf";

export enum Mode {
	Search = 0,
	Action = 1,
	Group = 2,
	Marks = 3,
}

export function placeholderForMode(m: Mode): string {
	switch (m) {
		case Mode.Search:
			return "Search Your Tabs";
		case Mode.Action:
			return "Act on Your Tabs";
		case Mode.Group:
			return "Perform Grouped Actions on Tab, like closing them all with <Ctrl-d>";
		case Mode.Marks:
			return "Jumps to Marks";
	}
}

export type MatchedTabs = Tabs & { matches: Record<number, HLMatchMeta> };
export type TabToMarks = Record<number, string>;

interface TabStore {
	// Core state
	query: string[];
	mode: Mode;
	activeSelection: number;

	// Computed values
	tabs: () => Tabs;
	marks: () => Marks;
	matchedTabs: () => MatchedTabs;

	// Actions
	setQuery: (q: string, mode?: Mode) => void;
	setMode: (mode: Mode) => void;
	setActiveSelection: (selection: number) => void;

	// Handlers
	onKeyDown: (event: KeyboardEvent) => void;
	onSubmit: (event: Event) => void;
	onTabClick: (tabId: number) => void;
}

const TabContext = createContext<TabStore>();

function defaultEmptyMatchedTabs(): MatchedTabs {
	const list: number[] = [];
	const data = {} as Record<number, Tab>;
	const matches = {} as Record<number, HLMatchMeta>;

	return { list, data, matches };
}

function buildHighlightedText(item: FuseResultMatch): HLText[] {
	if (item.value == null || item.indices.length === 0) {
		return [] as HLText[];
	}

	const result: HLText[] = item.value
		.split("")
		.map((ch) => ({ text: ch, hl: false }));

	const indexes = Array.from(item.indices).sort((a, b) => a[0] - b[0]);

	for (const idx of indexes) {
		for (let i = idx[0]; i <= idx[1]; i++) {
			result[i].hl = true;
		}
	}

	return result;
}

function computeMatchedTabs(
	mode: Mode,
	query: string[],
	tabs: () => Tabs,
): MatchedTabs {
	if (mode === Mode.Marks) {
		const tabIDs = tabs().list.filter(
			(tabID) => tabs().data[tabID].mark != null,
		);

		const data = tabIDs.reduce((acc, curr) => {
			acc[curr] = tabs().data[curr];
			return acc;
		}, {});

		return {
			list: tabIDs,
			data,
			matches: {},
		};
	}

	// search mode
	if (query[Mode.Search].length === 0) {
		return {
			list: tabs().list,
			data: tabs().data,
			matches: {},
		};
	}

	const tabSearchableData = tabs().list.map((tabID, idx) => ({
		idx: idx,
		id: tabID,
		title: tabs().data[tabID].title,
		url: tabs().data[tabID].url,
	}));

	const m = fuzzyFind(tabSearchableData, query[Mode.Search], {
		searchOnKeys: ["idx", "title", "url"],
	});

	if (m == null || m?.length === 0) {
		return defaultEmptyMatchedTabs();
	}

	logger.debug("tabs/matched", "list", m);

	return m.reduce((acc, curr) => {
		if (!curr.item.id) {
			return acc;
		}

		acc.list.push(curr.item.id);
		acc.data[curr.item.id] = tabs().data[curr.item.id];

		const title = curr.matches
			?.filter((item) => item.key === "title")
			.flatMap((item) => {
				return buildHighlightedText(item);
			});

		const url = curr.matches
			?.filter((item) => item.key === "url")
			.flatMap((item) => {
				return buildHighlightedText(item);
			});

		acc.matches[curr.item.id] = {
			title: title || ([] as HLText[]),
			url: url || ([] as HLText[]),
		};
		return acc;
	}, defaultEmptyMatchedTabs());
}

export const TabStoreProvider: ParentComponent = (props) => {
	const [tabs, setTabs] = withTabs();
	const [marks, { setMark, delMark }] = withMarks();

	const [markToTab, setMarkToTab] = createSignal({});

	createEffect(() => {
		perf.count("effect/mark-setter");
		for (const id of tabs().list) {
			const url = tabs().data[id]?.url || "";
			if (marks()?.urlToMark[url]) {
				tabs().data[id].mark = marks().urlToMark[url];
				setMarkToTab((m) => {
					m[marks().urlToMark[url]] = id;
					return m;
				});
			}
		}
	});

	const initialState = {
		query: ["", "", "", ""] as string[],
		mode: Mode.Search,
		activeSelection: 0,
	};

	const [store, setStore] = createStore(initialState);

	// Compute matchedTabs
	const matchedTabs = createMemo(() => {
		perf.count("memo/matched-tabs");
		return computeMatchedTabs(store.mode, store.query, tabs);
	});

	// Build actions
	const actions = {
		setQuery: (q: string, mode?: Mode) =>
			setStore("query", mode ?? store.mode, q),
		setMode: (mode: Mode) => setStore("mode", mode),
		setActiveSelection: (selection: number) =>
			setStore("activeSelection", selection),
	};

	createEffect(() => {
		logger.debug(
			"tracking",
			"mode",
			store.mode,
			"query",
			store.query[store.mode],
			"activeSelection",
			store.activeSelection,
		);
	});

	// Consolidated effect for all mode-related and query-related behaviors
	createEffect(() => {
		const q = store.query[store.mode];
		logger.debug("effect", "q", q, "mode", store.mode);

		switch (store.mode) {
			case Mode.Search: {
				// Handle mode switching from Search to Marks
				if (q.startsWith("`")) {
					batch(() => {
						actions.setQuery(q, Mode.Marks);
						actions.setQuery("", Mode.Search);
						actions.setMode(Mode.Marks);
					});
				}
				break;
			}

			case Mode.Marks: {
				// Return to search if query is empty
				if (q.length === 0) {
					actions.setMode(Mode.Search);
					break;
				}

				// Jump to mark when accessed
				if (q.length === 2 && q[0] === "`") {
					(async () => {
						await browser.tabs.update(markToTab()[q[1]], {
							active: true,
						});
					})();
					batch(() => {
						actions.setQuery("", store.mode);
						actions.setMode(Mode.Search);
					});
				}
				break;
			}

			case Mode.Action: {
				if (q.length !== 2) break;

				const [command, mark] = q;
				const tabId = matchedTabs().list[store.activeSelection];
				if (!tabId) break;

				switch (command) {
					case "m": // Create mark
						batch(() => {
							setMark(mark, matchedTabs().data[tabId].url || "");
							setTabs((t) => {
								t.data[tabId].mark = mark;
								return t;
							});
							actions.setQuery("");
							actions.setQuery("", Mode.Search);
							actions.setMode(Mode.Search);
						});
						break;

					case "d": // Delete mark
						batch(() => {
							delMark(mark);
							setTabs((t) => {
								delete t.data[markToTab()[mark]]?.mark;
								return t;
							});

							actions.setQuery("");
							actions.setQuery("", Mode.Search);
							actions.setMode(Mode.Search);
						});
						break;
				}
				break;
			}

			case Mode.Group:
				// No special query handling needed for Group mode
				break;
		}
	});

	// Consolidated effect for selection management
	createEffect(() => {
		const listLength = matchedTabs().list.length;

		// Keep selection in bounds
		if (store.activeSelection < 0) {
			actions.setActiveSelection(listLength - 1);
		} else if (store.activeSelection >= listLength) {
			actions.setActiveSelection(0);
		}
	});

	// Reset selection when search query changes
	createEffect((prevQuery) => {
		if (prevQuery !== store.query[Mode.Search]) {
			actions.setActiveSelection(0);
		}
		return store.query[Mode.Search];
	});

	const handlers = {
		groupAction(event: KeyboardEvent) {
			if (store.mode !== Mode.Group) {
				return;
			}

			if (event.ctrlKey && event.key === "d") {
				event.preventDefault();
				logger.debug("going to close tabs", "tabs", matchedTabs().list);
				(async () => {
					await browserApi.closeTab(matchedTabs().list);
				})();

				batch(() => {
					actions.setMode(Mode.Search);
					actions.setQuery("");
				});
			}
		},

		searchActions(event: KeyboardEvent) {
			if (store.mode !== Mode.Search) {
				return;
			}

			if (event.ctrlKey && event.key === "d") {
				event.preventDefault();
				(async () => {
					await browserApi.closeTab(matchedTabs().list[store.activeSelection]);
				})();

				actions.setQuery("");
			}

			if (event.ctrlKey && event.key === "m") {
				event.preventDefault();
				const tabId = matchedTabs().list[store.activeSelection];
				(async () => {
					await browserApi.toggleMute(tabId);
				})();
			}

			if (event.ctrlKey && event.key === "p") {
				event.preventDefault();
				const tabId = matchedTabs().list[store.activeSelection];
				(async () => {
					await browserApi.togglePin(tabId);
				})();
			}
		},

		musicActions(event: KeyboardEvent) {
			if (store.mode !== Mode.Action) {
				return;
			}

			if (event.code === "Space" || event.code === "ShiftLeft") {
				event.preventDefault();

				(async () => {
					const songInfo = await musicControls.playOrPauseSong(
						matchedTabs().list[store.activeSelection],
					);
					logger.debug("play/pause", "song", songInfo?.title);
				})();
			}

			if (event.code === "ArrowRight") {
				event.preventDefault();

				(async () => {
					const songInfo = await musicControls.nextSong(
						matchedTabs().list[store.activeSelection],
					);
					logger.debug("playing next", "song", songInfo?.title);
				})();
			}

			if (event.code === "ArrowLeft") {
				event.preventDefault();

				(async () => {
					const songInfo = await musicControls.prevSong(
						matchedTabs().list[store.activeSelection],
					);
					logger.debug("playing previous", "song", songInfo?.title);
				})();
			}
		},

		onKeyDown(event: KeyboardEvent) {
			// Mode switching
			if (event.key === "Escape") {
				event.preventDefault();
				actions.setQuery("");
				actions.setMode(Mode.Search);
				return;
			}

			if (event.key === "Tab") {
				event.preventDefault();
				actions.setMode(
					store.mode >= Mode.Group ? Mode.Search : store.mode + 1,
				);
				return;
			}

			// Navigation
			if (event.key === "ArrowUp") {
				actions.setActiveSelection(store.activeSelection - 1);
				return;
			}

			if (event.key === "ArrowDown") {
				actions.setActiveSelection(store.activeSelection + 1);
				return;
			}

			// Delegate to specific handlers
			handlers.searchActions(event);
			handlers.groupAction(event);
			handlers.musicActions(event);
		},

		onSubmit(e: Event) {
			e.preventDefault();
			const tabId = matchedTabs().list[store.activeSelection];
			(async () => {
				await browser.tabs.update(tabId, { active: true });
			})();
			actions.setQuery("");
		},

		onTabClick(tabId: number) {
			(async () => {
				await browser.tabs.update(tabId, { active: true });
			})();
		},
	};

	const eventHandlers = {
		onKeyDown: handlers.onKeyDown,
		onSubmit: handlers.onSubmit,
		onTabClick: handlers.onTabClick,
	};

	const value: TabStore = {
		get query() {
			return store.query;
		},

		get mode() {
			return store.mode;
		},

		get activeSelection() {
			return store.activeSelection;
		},

		tabs,
		marks,
		matchedTabs,

		...actions,
		...eventHandlers,
	};

	return (
		<TabContext.Provider value={value}>{props.children}</TabContext.Provider>
	);
};

export function useTabStore() {
	const context = useContext(TabContext);
	if (!context) {
		throw new Error("useTabStore must be used within TabProvider");
	}
	return context;
}
