import { createEffect, createResource } from "solid-js";
import { browserApi } from "../pkg/browser-api";
import { produce } from "solid-js/store";
import {
	defaultOptions,
	readOptions,
	saveOptions,
	THEME_DARK,
	THEME_LIGHT,
	type Options,
} from "./options";

export const OptionsPage = () => {
	const [options, { mutate: setOptions }] = createResource<Options>(
		readOptions,
		{
			initialValue: defaultOptions(),
			name: "fetching options from storage.local",
		},
	);

	createEffect(() => {
		const opt = options();
		if (!opt) {
			return;
		}
		saveOptions(opt);
	});

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

			<label for="block-youtube-shorts" class="w-80">
				Youtube (Remove Shorts)
			</label>

			<select
				id="theme-picker"
				class="bg-gray-200 rounded-md checked:bg-green-500 border-none relative p-2"
				onChange={(e) => {
					setOptions(
						produce((opt) => {
							opt.youtube.removeShorts = e.target.value === "true";
						}),
					);
				}}
			>
				<option value={"true"} selected={options().youtube.removeShorts}>
					Yes
				</option>
				<option value="false" selected={!options().youtube.removeShorts}>
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
				value={options().youtube.shortsSelectors}
				onInput={(e) => {
					setOptions(
						produce((opt) => {
							opt.youtube.shortsSelectors = e.target.value.split("\n");
						}),
					);
				}}
			/>
		</form>
	);
};
