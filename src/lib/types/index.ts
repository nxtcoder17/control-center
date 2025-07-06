import type * as browser from "webextension-polyfill";

export interface Tabs {
	list: number[];
	data: Record<number, browser.Tabs.Tab & { idx?: number }>;
}

export const DEFAULT_EMPTY_TABS: Tabs = {
	list: [] as number[],
	data: {} satisfies Record<number, browser.Tabs.Tab>,
};

export interface MatchAttrs {
	key: string;
	value: string;
	indices?: number[][];
}

export type Marks = Record<string, number>;

export const DEFAULT_EMPTY_MARKS: Marks = {} satisfies Marks;
