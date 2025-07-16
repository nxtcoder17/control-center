import { For, type Ref, Switch, Match } from "solid-js";
import { BrowserTab } from "./components/browser-tab";
import { PowerlineIcon } from "../pkg/ui/components/icons";
import { QueryTextField } from "./components/query-text-field";
import { useTabStore, Mode, placeholderForMode } from "./stores/tab-store";

const Page = () => {
	const tabs = useTabStore();

	let inputRef: Ref<any>;
	setInterval(() => {
		// HACK: this is a hack to make sure that the input is always focused
		if (Boolean(inputRef) && inputRef.current !== document.activeElement) {
			inputRef.focus();
		}
	});

	return (
		<div class="h-screen py-8 dark:bg-slate-800">
			<div class="h-full flex flex-col gap-3">
				<div class="px-16 flex flex-row gap-4">
					<form
						class="flex-1 bg-slate-100 dark:bg-slate-900 rounded-r-md"
						onKeyDown={tabs.onKeyDown}
						onSubmit={tabs.onSubmit}
					>
						<div class="flex flex-row">
							{tabs.mode !== Mode.Search && (
								<div class="relative flex">
									<div class="bg-slate-300 dark:bg-slate-700 pl-4 pr-1 flex items-center">
										<div class="text-lg text-slate-700 dark:text-slate-500 font-bold scale-110 tracking-wide">
											{tabs.mode === Mode.Action && "Action"}
											{tabs.mode === Mode.Group && "Group"}
											{tabs.mode === Mode.Marks && "Marks"}
										</div>
									</div>
									<PowerlineIcon class="w-5 h-full fill-slate-300 dark:fill-slate-700 dark:bg-slate-900" />
								</div>
							)}

							<QueryTextField
								ref={inputRef}
								value={tabs.query[tabs.mode]}
								setValue={(v) => {
									tabs.setQuery(v);
								}}
								placeholder={placeholderForMode(tabs.mode)}
							/>
						</div>
					</form>

					<div class="text-medium text-2xl dark:text-gray-200">
						Tabs ({tabs.matchedTabs().list.length || 0}/
						{tabs.tabs().list.length})
					</div>
				</div>

				<div class="px-16 flex-1 relative rounded-lg overflow-y-auto">
					<div class="flex flex-col gap-2">
						<For each={tabs.matchedTabs().list}>
							{(tabId, idx) => {
								return (
									<BrowserTab
										idx={tabs.tabs().data[tabId].idx}
										vimMark={tabs.tabs().data[tabId].mark}
										tabInfo={tabs.tabs().data[tabId]}
										isSelected={tabs.activeSelection === idx()}
										matches={tabs.matchedTabs().matches[tabId]}
										onClick={() => tabs.onTabClick(tabId)}
									/>
								);
							}}
						</For>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Page;
