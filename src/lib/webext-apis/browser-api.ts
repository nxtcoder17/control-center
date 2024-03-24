import * as browser from 'webextension-polyfill'

interface BrowserApi {
	listAllTabs: () => Promise<browser.Tabs.Tab[]>
	areTabsEqual: (prev: browser.Tabs.Tab, next: browser.Tabs.Tab) => boolean
	togglePin: (tabId: number) => Promise<void>
	toggleMute: (tabId: number) => Promise<void>
	closeTab: (tabId: number) => Promise<void>
	localStore: {
		set: <T>(key: string, value: T) => Promise<void>
		get: <T>(key: string) => Promise<T> | Promise<null>
	}
	listContextualIdentities: () => Promise<browser.ContextualIdentities.ContextualIdentity[]>
}
export const browserApi: BrowserApi = {} as any

browserApi.listAllTabs = async () => {
	return await browser.tabs.query({})
}

browserApi.areTabsEqual = (prev, next) => {
	if (prev?.id !== next?.id) {
		return false
	}

	if (prev?.pinned !== next?.pinned) {
		return false
	}

	if (prev?.mutedInfo?.muted !== next?.mutedInfo?.muted) {
		return false
	}

	if (prev?.title !== next?.title) {
		return false
	}

	if (prev?.url !== next?.url) {
		return false
	}
	return true
}

browserApi.togglePin = async (tabId) => {
	const tab = await browser.tabs.get(tabId)
	await browser.tabs.update(tabId, {
		pinned: !tab.pinned,
	})
}

browserApi.toggleMute = async (tabId) => {
	const tab = await browser.tabs.get(tabId)
	if (tab == null) {
		return
	}
	await browser.tabs.update(tabId, {
		muted: (tab.mutedInfo?.muted) === false,
	})
}

browserApi.closeTab = async (tabId) => {
	await browser.tabs.remove(tabId)
}

browserApi.localStore = {
	set: async (key, value) => {
		await browser.storage.local.set({ [key]: value })
	},
	get: async (key) => {
		const item = await browser.storage.local.get(key)
		return item[key]
	},
}

browserApi.listContextualIdentities = async () => {
	return await browser.contextualIdentities.query({})
}
