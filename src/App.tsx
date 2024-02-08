import { createSignal, For, type Ref, Switch, Match, createEffect, batch, type Accessor } from 'solid-js'
import * as browser from 'webextension-polyfill'
import { PageRoot } from './lib/components/page'
import { BrowserTab } from './lib/components/browser-tab'
import { PowerlineIcon } from './lib/components/icons'
import { fuzzyFind } from './pkg/fuzzy/fuzzy-finder'
import { createStore, produce } from 'solid-js/store'
import { musicControls } from './lib/webext-apis/music-controls'
import { withTabs } from './lib/hooks/tabs'
import { QueryTextField } from './lib/components/query-text-field'
import { useMarks } from './lib/hooks/marks'
import { type Tabs, DEFAULT_EMPTY_TABS } from './lib/types'
import { browserApi } from './lib/webext-apis/browser-api'

export type MatchedTabs = Tabs & { matches: Record<number, MatchAttrs[]> }
export const DEFAULT_EMPTY_MATCHED_TABS: MatchedTabs = { ...DEFAULT_EMPTY_TABS, matches: {} satisfies Record<number, MatchAttrs[]> }

interface MatchAttrs { key: string, value: string, indices?: number[][] }

const DEFAULT_MATCH_ATTRS: MatchAttrs = { key: '', value: '', indices: [] as number[][] }

export type TabToMarks = Record<number, string>

enum Mode {
	Search = 0,
	Action = 1,
	Group = 2,
	Marks = 3,
}

function placeholderForMode(m: Mode): string {
	switch (m) {
		case Mode.Search:
			return 'Search Your Tabs'
		case Mode.Action:
			return 'Act on Your Tabs'
		case Mode.Group:
			return 'Perform Grouped Actions on Tab, like closing them all with <Ctrl-d>'
		case Mode.Marks:
			return 'Jumps to Marks'
	}
}

const App = () => {
	const tabs = withTabs()

	const [marks, setMarks] = useMarks()

	const tabToMarks: Accessor<TabToMarks> = () => Object.entries(marks())
		.filter(([_, tabId]) => !tabs().data[tabId]?.url?.startsWith('moz-extension://'))
		.reduce((acc, [mark, tabId]) => {
			return { ...acc, [tabId]: mark }
		}, {} satisfies TabToMarks)

	const [query, setQuery] = createStore<string[]>(['', '', '', ''])

	const [mode, setMode] = createSignal<Mode>(Mode.Search)

	createEffect(() => {
		if (mode() === Mode.Search && query[Mode.Search].startsWith('`')) {
			batch(() => {
				setMode(Mode.Marks)
				setQuery(produce(q => {
					q[Mode.Marks] = query[Mode.Search]
					q[Mode.Search] = ''
				}))
			})
		}
	})

	createEffect(() => {
		if (mode() !== Mode.Marks) {
			return null
		}

		if (query[Mode.Marks].length === 0) {
			setMode(Mode.Search)
		}

		// trying to check whether mark is begin accessed
		if (query[Mode.Marks].length === 2 && query[Mode.Marks][0] === '`') {
			const mark = query[Mode.Marks][1]
			void (async () => {
				await browser.tabs.update(marks()[mark], { active: true })
				setQuery(produce(q => {
					q[Mode.Marks] = ''
				}))
			})()
		}
	})

	const matchedTabs = (): MatchedTabs => {
		if (mode() === Mode.Marks) {
			const tabIds = Object.keys(tabToMarks()).map(Number).filter(tabId => tabId in tabs().data)
			const x = {
				list: tabIds,
				data: tabIds.reduce((acc, curr) => {
					return { ...acc, [curr]: tabs().data[curr] }
				}, {}),
				matches: {},
			}
			logger.info('matchedTabs', { x })
			return x
		}

		// search mode
		if (query[Mode.Search].length === 0) {
			return {
				list: tabs().list,
				data: tabs().data,
				matches: {},
			}
		}

		const m = fuzzyFind(Object.values(tabs().data), query[Mode.Search], {
			searchOnKeys: ['title', 'url'],
		})

		if (m == null || m?.length === 0) {
			return DEFAULT_EMPTY_MATCHED_TABS
		}

		return m.reduce((acc, curr) => {
			const matches = curr.matches?.map(item => {
				return {
					key: item.key ?? '',
					value: item.value ?? '',
					indices: item.indices.map(x => {
						return [x[0], x[1]]
					}),
				}
			})

			return {
				list: [...acc.list, Number(curr.item.id)],
				data: { ...acc.data, [Number(curr.item.id)]: curr.item },
				matches: { ...acc.matches, [Number(curr.item.id)]: matches ?? [DEFAULT_MATCH_ATTRS] },
			}
		}, DEFAULT_EMPTY_MATCHED_TABS)
	}

	const [activeSelection, setActiveSelection] = createSignal(0)

	function groupAction(event: KeyboardEvent) {
		if (mode() !== Mode.Group) {
			return
		}

		if (event.ctrlKey && event.key === 'd') {
			event.preventDefault()
			const tabIds = matchedTabs().list
			logger.debug('going to close tabs', { tabIds })
			void (async () => {
				await browser.tabs.remove(tabIds)
			})()

			batch(() => {
				setQuery(produce(q => {
					q[Mode.Group] = ''
					q[Mode.Search] = ''
				}))

				setMode(Mode.Search)
				logger.debug('mode: ', { mode: mode() })
			})
		}
	}

	function searchActions(event: KeyboardEvent) {
		if (mode() !== Mode.Search) {
			return
		}

		if (event.ctrlKey && event.key === 'x') {
			event.preventDefault()
			setMode(v => {
				if (v === Mode.Group) {
					return Mode.Search
				}
				return Mode.Group
			})
		}

		if (event.ctrlKey && event.key === 'd') {
			event.preventDefault()
			const tabId = matchedTabs().list[activeSelection()]
			void (async () => {
				await browser.tabs.remove(tabId)
			})()
			setQuery(produce(q => {
				q[Mode.Search] = ''
			}))
		}

		if (event.ctrlKey && event.key === 'm') {
			event.preventDefault()
			const tabId = matchedTabs().list[activeSelection()]
			void (async () => {
				await browserApi.toggleMute(tabId)
			})()
			// setQuery(produce(q => {
			//   q[Mode.Search] = ''
			// }))
		}

		if (event.ctrlKey && event.key === 'p') {
			event.preventDefault()
			const tabId = matchedTabs().list[activeSelection()]
			void (async () => {
				await browserApi.togglePin(tabId)
			})()
			// setQuery(produce(q => {
			//   q[Mode.Search] = ''
			// }))
		}
	}

	function musicActions(event: KeyboardEvent) {
		if (mode() !== Mode.Action) {
			return
		}

		if (event.code === 'Space' || event.code === 'ShiftLeft') {
			event.preventDefault()
			const tabId = matchedTabs().list[activeSelection()]
			void (async () => {
				await musicControls.playOrPauseSong(tabId)
			})()
			logger.info('playing or pausing song', { tabId })
		}

		if (event.code === 'ArrowRight') {
			event.preventDefault()
			const tabId = matchedTabs().list[activeSelection()]
			void (async () => {
				const songInfo = await musicControls.nextSong(tabId)
				logger.info('playing next song', { title: songInfo?.title })
			})()
		}

		if (event.code === 'ArrowLeft') {
			event.preventDefault()
			const tabId = matchedTabs().list[activeSelection()]
			void (async () => {
				const songInfo = await musicControls.prevSong(tabId)
				logger.info('playing prev song', { title: songInfo?.title })
			})()
		}
	}

	function onKeyDown(event: KeyboardEvent) {
		// mode switching
		if (event.key === 'Escape') {
			event.preventDefault()
			setMode(Mode.Search)
			return
		}

		if (event.key === 'Tab') {
			event.preventDefault()
			setMode(v => {
				if (v >= Mode.Group) {
					return Mode.Search
				}
				return v + 1
			})
			return
		}

		if (event.key === 'ArrowUp') {
			setActiveSelection((idx) => idx - 1)
			return
		}

		if (event.key === 'ArrowDown') {
			setActiveSelection((idx) => idx + 1)
		}

		searchActions(event)
		groupAction(event)
		musicActions(event)
	}

	createEffect(() => {
		if (activeSelection() < 0) {
			setActiveSelection(matchedTabs().list.length - 1)
		}
		if (activeSelection() >= matchedTabs().list.length) {
			setActiveSelection(0)
		}
	})

	createEffect((prevQuery) => {
		if (prevQuery !== query[Mode.Search]) {
			setActiveSelection(0)
		}
	})

	createEffect(() => {
		if (mode() === Mode.Action && query[mode()].length === 2 && query[mode()].startsWith('m')) {
			const mark = query[Mode.Action][1]
			const tabId = matchedTabs().list[activeSelection()]
			if (tabId != null) {
				batch(() => {
					setQuery(produce(q => {
						q[Mode.Action] = ''
					}))
					setMarks((m) => {
						return { ...m, [mark]: tabId }
					})
					setMode(Mode.Search)
				})
			}
		}

		if (mode() === Mode.Action && query[mode()].length === 2 && query[mode()].startsWith('d')) {
			const mark = query[Mode.Action][1]
			const tabId = matchedTabs().list[activeSelection()]
			if (tabId != null) {
				batch(() => {
					setQuery(produce(q => {
						q[Mode.Action] = ''
					}))
					setMarks((m) => {
						delete m[mark]
						return { ...m }
					})
					setMode(Mode.Search)
				})
			}
		}
	})

	let inputRef: Ref<any>
	setInterval(() => {
		// HACK: this is a hack to make sure that the input is always focused
		if ((Boolean(inputRef)) && inputRef.current !== document.activeElement) {
			inputRef.focus()
		}
	})

	return <PageRoot>
		<div class="px-16 py-6 h-full flex-1 flex flex-col gap-3 dark:bg-slate-800">
			<form
				onKeyDown={onKeyDown}
				onSubmit={(e) => {
					e.preventDefault()
					const tabId = matchedTabs().list[activeSelection()]
					void (async () => {
						await browser.tabs.update(tabId, { active: true })
					})()
					batch(() => {
						setQuery(produce(q => {
							q[mode()] = ''
						}))
					})
				}}
			>
				<Switch
					fallback={
						<QueryTextField
							ref={inputRef}
							value={query[mode()]}
							setValue={(v) => {
								setQuery(produce(q => {
									q[mode()] = v
								}))
							}}
							placeholder={placeholderForMode(mode())}
							class="rounded-l-md"
						/>}
				>
					<Match when={mode() === Mode.Action}>
						<div class="flex flex-row">
							<div class="relative flex">
								<div class="bg-slate-700 pl-4 pr-1 flex items-center">
									<div class="text-lg text-slate-500 font-bold scale-110 tracking-wide">Action</div>
								</div>
								<PowerlineIcon class="w-5 h-full fill-slate-700 dark:bg-slate-900" />
							</div>

							<QueryTextField
								ref={inputRef}
								value={query[mode()]}
								setValue={(v) => {
									setQuery(produce(q => {
										q[mode()] = v
									}))
								}}
								placeholder={placeholderForMode(mode())}
							/>
						</div>
					</Match>

					<Match when={mode() === Mode.Group}>
						<div class="flex flex-row">
							<div class="relative flex">
								<div class="bg-slate-700 pl-4 pr-1 flex items-center">
									<div class="text-lg text-slate-500 font-bold scale-110 tracking-wide">Group Filter</div>
								</div>
								<PowerlineIcon class="w-5 h-full fill-slate-700 dark:bg-slate-900" />
							</div>

							<QueryTextField
								ref={inputRef}
								value={query[mode()]}
								setValue={(v) => {
									setQuery(produce(q => {
										q[mode()] = v
									}))
								}}
								placeholder={placeholderForMode(mode())}
							/>
						</div>
					</Match>
				</Switch>
			</form>

			<div class="text-medium text-2xl dark:text-gray-200">Tabs ({matchedTabs().list.length || 0}/{tabs().list.length})</div>

			<div class="overflow-x-visible flex-1 relative">
				<div class="overflow-y-auto flex flex-col gap-2">
					<For each={matchedTabs().list}>
						{(tabId, idx) => {
							return <BrowserTab
								index={idx() + 1}
								vimMark={tabToMarks()?.[tabId]}
								tabInfo={tabs().data[tabId]}
								isSelected={activeSelection() === idx()}
								matches={matchedTabs()?.matches[tabId]}
								onClick={() => {
									void (async () => {
										await browser.tabs.update(tabId, { active: true })
									})()
								}}
							/>
						}}
					</For >
				</div>
			</div>
		</div>

	</PageRoot >
}

export default App
