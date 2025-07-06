import type { FuseResult } from "fuse.js";
import Fuse from "fuse.js";

interface Opts {
	sortPredicate?: <T>(a: T, b: T) => number;
	searchOnKeys?: string[];
}

export function fuzzyFind<T>(
	list: T[],
	query: string,
	opts?: Opts,
): Array<FuseResult<T>> | null {
	const sortPredicate = opts
		? opts.sortPredicate
		: (a: any, b: any) => a.index - b.index;

	if (query === "") {
		return null;
	}

	const f = new Fuse(list, {
		keys: opts ? opts.searchOnKeys : [],
		includeScore: true,
		includeMatches: true,
		useExtendedSearch: true,
		isCaseSensitive: false,
	});

	return f.search<T>(query);
}
