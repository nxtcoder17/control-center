import { browserApi } from "../pkg/browser-api";

const OPTION_KEY = "options";

export interface Options {
	theme: string;
	youtube: YoutubeOptions;
}

interface YoutubeOptions {
	removeShorts: boolean;
	shortsSelectors: string[];
}

export const THEME_LIGHT: string = "light";
export const THEME_DARK: string = "dark";

export const defaultOptions = () => {
	return {
		theme: THEME_LIGHT,
		youtube: {
			removeShorts: true,
			shortsSelectors: [],
		},
	};
};

export async function readOptions(): Promise<Options> {
	return browserApi.localStore.getOrDefault<Options>(
		OPTION_KEY,
		defaultOptions(),
	);
}

export async function saveOptions(opt: Options) {
	return browserApi.localStore.set<Options>(OPTION_KEY, opt);
}
