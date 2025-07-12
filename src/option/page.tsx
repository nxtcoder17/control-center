// import { Select } from 'solid-blocks';
import { createEffect, createResource, createSignal } from "solid-js";
import { browserApi } from "../pkg/browser-api";
import { produce } from "solid-js/store";
import { OPT_YT_SHORTS_REMOVE } from "../constants/store-keys";
// import { NxtSelect } from '../components/select';

const THEME_LIGHT: string = "light";
const THEME_DARK: string = "dark";

export interface Options {
	theme: string;
	ytShortsSelectors: string;
	blockYoutubeThumbnails: boolean;
}

const defaultOpts: Options = {
	theme: THEME_LIGHT,
	ytShortsSelectors: ["ytd-reel-shelf-renderer", "ytd-shorts"].join("\n"),
	blockYoutubeThumbnails: false,
};

export const OptionsPage = () => {
	const [options, setOptions] = createSignal<Options>(defaultOpts);
	// const [theme, setTheme] = createSignal(THEME_LIGHT)
	// const [keyboardShortcut, setKeyboardShortcut] = createSignal('Ctrl+E')
	// const [blockYoutubeShorts, setBlockYoutubeShorts] = createSignal(false)

	// eslint-disable-next-line solid/reactivity
	const [savedOptions] = createResource<null | Options>(async () => {
		const opt = await browserApi.localStore.get<Options>("options");
		logger.info("extension options", { opt });
		return opt;
	});

	createEffect(() => {
		const opt = savedOptions();
		if (!opt) {
			return;
		}
		setOptions(opt);
	});

	const [removeYTShorts, setRemoveYTShorts] = createSignal(true);

	return (
		<form
			class="flex flex-col gap-2 px-4 py-6"
			onSubmit={(e) => {
				e.preventDefault();

				(async () => {
					await browserApi.localStore.set("options", options());
				})();
			}}
		>
			<div class="flex gap-2 items-center">
				<label for="theme-picker" class="w-80">
					Choose Extension Theme
				</label>
				<select
					id="theme-picker"
					class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative"
					onChange={(e) => {
						setOptions(
							produce((opt) => {
								opt.theme = e.target.value;
							}),
						);
					}}
				>
					<option value="light" selected={options().theme === THEME_LIGHT}>
						Light
					</option>
					<option value="dark" selected={options().theme === THEME_DARK}>
						Dark
					</option>
				</select>
			</div>

			<div class="flex gap-2 items-center">
				<label for="extension-shortcut" class="w-80">
					Toggle Extension Shortcut
				</label>
				<input
					disabled
					id="extension-shortcut"
					type="text"
					class="bg-gray-200 rounded-md checked:bg-green-500 border-none"
					placeholder="Ctrl+Shift+E"
					// value={keyboardShortcut().trim()}
					// onInput={e => setKeyboardShortcut(e.target.value)}
				/>
			</div>

			<label for="block-youtube-shorts" class="w-80">
				Block Youtube Shorts
			</label>

			<select
				id="theme-picker"
				class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative p-2"
				onChange={(e) => {
					setRemoveYTShorts(e.target.value === "true");
					browserApi.localStore.set(
						OPT_YT_SHORTS_REMOVE,
						e.target.value === "true",
					);
				}}
			>
				<option value={"true"} selected={removeYTShorts()}>
					Yes
				</option>
				<option value="false" selected={!removeYTShorts()}>
					No
				</option>
			</select>

			<label for="block-youtube-shorts" class="w-80">
				Youtube Shorts Selectors
			</label>
			<textarea
				id="yt-shorts-selectors"
				class="bg-gray-200 rounded-md checked:bg-green-500 border-none"
				rows={5}
				placeholder="enter selectors one in each line"
				value={options().ytShortsSelectors}
				onInput={(e) => {
					setOptions(
						produce((opt) => {
							opt.ytShortsSelectors = e.target.value;
						}),
					);
					setRemoveYTShorts(e.target.value === "true");
					browserApi.localStore.set(
						OPT_YT_SHORTS_REMOVE,
						e.target.value === "true",
					);
				}}
			/>

			<div class="flex gap-6">
				<button
					type="submit"
					class="bg-blue-500 hover:bg-blue-700 text-blue-100 font-bold py-1 px-3 rounded-md"
				>
					Save
				</button>
				<button
					type="reset"
					class="border border-slate-500 hover:bg-slate-600 text-slate-400 font-bold py-1 px-3 rounded-md"
				>
					Cancel
				</button>
			</div>
		</form>
	);
};
