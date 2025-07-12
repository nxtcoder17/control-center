import { browserApi } from "../../pkg/browser-api";
import * as browser from "webextension-polyfill";
import { createResource, Setter, type Accessor } from "solid-js";
import * as perf from "../../pkg/perf";

function isExtensionTab(tab: browser.Tabs.Tab): boolean {
	return tab.url?.startsWith(browser.runtime.getURL("")) ?? false;
}

export type Tab = browser.Tabs.Tab & {
	idx: number;
	mark?: string;
};

export interface Tabs {
	list: number[];
	data: Record<number, Tab>;
}

export const DEFAULT_EMPTY_TABS: Tabs = {
	list: [] as number[],
	data: {} satisfies Record<number, browser.Tabs.Tab>,
};

let tabIdx = 0;

const fetchListOfTabs = async (): Promise<Tabs> => {
	const t = await browserApi.listAllTabs();
	perf.count("fetcher/list-of-tabs");

	logger.debug("tabs/all", "list", t);

	const t2 = t
		.filter(
			(item) => item.url !== browser.runtime.getURL("src/background.html"),
		)
		.reduce((acc, curr: Tab) => {
			if (isExtensionTab(curr)) {
				logger.info("skipping background page", { url: curr.url });
				return acc;
			}
			tabIdx += 1;

			acc.list.push(Number(curr.id));
			acc.data[Number(curr.id)] = { ...curr, idx: tabIdx };
			return acc;
		}, DEFAULT_EMPTY_TABS);

	// logger.debug(
	// 	"tabs/meta",
	// 	"contextual-identities",
	// 	await browserApi.listContextualIdentities(),
	// );

	return t2;
};

export const withTabs = (): [Accessor<Tabs>, Setter<Tabs>] => {
	const [tabs, { mutate }] = createResource<Tabs>(fetchListOfTabs, {
		initialValue: { list: [], data: {} },
		name: "fetching list of tabs",
	});

	const setTabs = (f: (old: Tabs) => void) => {
		perf.count("resource/tabs/set");
		mutate((t) => {
			f(t);
			return { ...t };
		});
	};

	browser.tabs.onUpdated.addListener((tabId, _changeInfo, tab) => {
		logger.debug("tab/updated", "tab.id", tabId, "tab.title", tab.title);
		setTabs((d) => {
			if (tabId != null && tab.status === "complete") {
				if (isExtensionTab(tab)) {
					return;
				}
				if (!(tabId in d.data)) {
					d.list.push(tabId);
				}
				tabIdx++;
				d.data[tabId] = { ...tab, idx: tabIdx };
			}
		});
	});

	browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
		logger.debug("tab/removed", "tab.id", tabId, "removed.info", removeInfo);

		setTabs((d) => {
			d.list = d.list.filter((id) => id !== tabId);
			delete d.data[tabId];
		});
	});

	return [tabs, setTabs];
};
