import { type InitializedResource, createResource } from "solid-js";
import { browserApi } from "../../pkg/browser-api";
import * as perf from "../../pkg/perf";

// key is mark key
// value is URL
// export type Marks = Record<string, string>;
export interface Marks {
	markToURL: Record<string, string>;
	urlToMark: Record<string, string>;
}

function defaultMarks() {
	return {
		markToURL: {},
		urlToMark: {},
	};
}

interface MarksOP {
	setMark: (mark: string, url: string) => void;
	delMark: (mark: string) => void;
}

export const withMarks = (): [InitializedResource<Marks>, MarksOP] => {
	const key = "vim-marks";

	const fetcher = async (): Promise<Marks> => {
		perf.count("fetcher/marks");
		const v = await browserApi.localStore.get<Marks>(key);
		logger.debug("storage/get", "marks", v);
		if (v == null) {
			return defaultMarks();
		}

		const result = {
			markToURL: v,
			urlToMark: Object.entries(v).reduce((acc, [mark, url]) => {
				acc[url] = mark;
				return acc;
			}, {}),
		};

		return result as Marks;
	};

	const [marks, { mutate }] = createResource<Marks>(fetcher, {
		initialValue: defaultMarks(),
		name: "marks",
	});

	const setMark = (mark: string, url: string) => {
		perf.count("resource/marks/set");
		const updated = mutate((m) => {
			m.markToURL[mark] = url;
			m.urlToMark[url] = mark;
			return m;
		});

		logger.debug("marks/set", "marks", updated.markToURL);
		browserApi.localStore.set(key, updated.markToURL);
	};

	const delMark = (mark: string) => {
		perf.count("resource/marks/del");
		const updated = mutate((m) => {
			const url = m.markToURL[mark];
			delete m.markToURL[mark];
			delete m.urlToMark[url];
			return m;
		});
		logger.debug("marks/del", "marks", updated.markToURL);
		browserApi.localStore.set(key, updated.markToURL);
	};

	return [marks, { setMark, delMark }];
};
