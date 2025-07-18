import {
	type InitializedResource,
	createEffect,
	createResource,
	type Setter,
} from "solid-js";
import { DEFAULT_EMPTY_MARKS, type Marks } from "../types";
import { browserApi } from "../webext-apis/browser-api";

export const withMarks = (): [InitializedResource<Marks>, Setter<Marks>] => {
  const key = "control-center.vim-marks"

  const fetcher = async (): Promise<Marks>  => {
	  const v = await browserApi.localStore.get<Marks>(key);
	  if (v == null) {
		  return DEFAULT_EMPTY_MARKS;
	  }

	  return v;
  }

	const [marks, { mutate }] = createResource<Marks>(fetcher, {
		initialValue: {} satisfies Marks,
		name: "marks",
	});

	createEffect(() => {
		const allMarks = marks();
		if (Object.keys(allMarks).length === 0) {
			return;
		}
		void (async () => {
			await browserApi.localStore.set(key, allMarks);
			logger.debug("persisted marks into local-storage", "marks", allMarks);
		})();
	});

	return [marks, mutate];
};
