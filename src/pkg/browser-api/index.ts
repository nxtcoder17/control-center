import * as browser from "webextension-polyfill";

interface BrowserApi {
	listAllTabs: () => Promise<browser.Tabs.Tab[]>;
	tabExists: (tabID: number | undefined) => Promise<boolean>;
	areTabsEqual: (prev: browser.Tabs.Tab, next: browser.Tabs.Tab) => boolean;
	togglePin: (tabId: number) => Promise<void>;
	toggleMute: (tabId: number) => Promise<void>;
	closeTab: (tabId: number | number[]) => Promise<void>;
	localStore: {
		set: <T>(key: string, value: T) => Promise<void>;
		get: <T>(key: string) => Promise<T> | Promise<unknown>;
		getOrDefault: <T>(key: string, defaultVal?: T) => Promise<T>;
	};
	listContextualIdentities: () => Promise<
		browser.ContextualIdentities.ContextualIdentity[]
	>;
}

export const browserApi = {} as BrowserApi;

browserApi.listAllTabs = async () => {
	return await browser.tabs.query({});
};

browserApi.tabExists = async (tabID) => {
	if (!tabID) {
		return false;
	}
	try {
		await browser.tabs.get(tabID);
		return true;
	} catch (_err) {
		return false;
	}
};

browserApi.areTabsEqual = (prev, next) => {
	if (prev?.id !== next?.id) {
		return false;
	}

	if (prev?.pinned !== next?.pinned) {
		return false;
	}

	if (prev?.mutedInfo?.muted !== next?.mutedInfo?.muted) {
		return false;
	}

	if (prev?.title !== next?.title) {
		return false;
	}

	if (prev?.url !== next?.url) {
		return false;
	}
	return true;
};

browserApi.togglePin = async (tabId) => {
	const tab = await browser.tabs.get(tabId);
	await browser.tabs.update(tabId, {
		pinned: !tab.pinned,
	});
};

browserApi.toggleMute = async (tabId) => {
	const tab = await browser.tabs.get(tabId);
	if (tab == null) {
		return;
	}
	await browser.tabs.update(tabId, {
		muted: tab.mutedInfo?.muted === false,
	});
};

browserApi.closeTab = async (tabIds) => {
	await browser.tabs.remove(tabIds);
};

browserApi.localStore = {
	set: async (key, value) => {
		return browser.storage.local.set({ [key]: value });
	},

	get: async (key) => {
		const item = await browser.storage.local.get(key);
		return item[key];
	},

	getOrDefault: async (key, defaultVal) => {
		const item = await browser.storage.local.get(key);
		console.log("api.get", "item", item);
		if (item[key]) {
			return item[key];
		}
		return defaultVal;
	},
};

browserApi.listContextualIdentities = async () => {
	return await browser.contextualIdentities.query({});
};
