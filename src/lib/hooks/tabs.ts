import { DEFAULT_EMPTY_TABS, type Tabs } from '../types'
import { browserApi } from '../webext-apis/browser-api'
import * as browser from 'webextension-polyfill'
import { createResource } from 'solid-js'

function isExtensionTab(tab: browser.Tabs.Tab): boolean {
	return tab.url?.startsWith(browser.runtime.getURL('')) ?? false
}

const fetchListOfTabs = async (): Promise<Tabs> => {
	const t = await browserApi.listAllTabs()

	logger.debug('all tabs', { tabs: t })

	let tIdx = 0
	const t2 = t
		.filter(item => item.url !== browser.runtime.getURL('src/background.html'))
		.reduce((acc, curr) => {
			if (isExtensionTab(curr)) {
				logger.info('skipping background page', { url: curr.url })
				return acc
			}
			tIdx += 1

			logger.debug('adding tab', { tab: curr })

			return {
				list: [...acc.list, Number(curr.id)],
				data: { ...acc.data, [Number(curr.id)]: { ...curr, idx: tIdx } },
			}
		}, DEFAULT_EMPTY_TABS)

	logger.info('identities', { identities: await browserApi.listContextualIdentities() })

	return t2
}

export const withTabs = () => {
	const [tabs, { mutate }] = createResource<Tabs>(fetchListOfTabs, { initialValue: { list: [], data: {} }, name: 'fetching list of tabs' })

	const setTabs = (f: (argTabs: Tabs) => void) => {
		mutate(t => {
			f(t)
			return { ...t }
		})
	}

	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		logger.debug('listened for onUpdated', { tabId, changeInfo, tab })
		setTabs((d) => {
			if (tabId != null && tab.status === 'complete') {
				if (isExtensionTab(tab)) {
					return
				}
				if (!(tabId in d.data)) {
					d.list.push(tabId)
				}
				d.data[tabId] = tab
			}
		})
	})

	browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
		logger.debug('listened for onRemoved', { tabId, removeInfo })
		setTabs((d) => {
			d.list = d.list.filter(id => id !== tabId)
			delete (d.data[tabId])
		})
	})

	return tabs
}
