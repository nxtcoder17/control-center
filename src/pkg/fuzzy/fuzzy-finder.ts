import Fuse from "fuse.js";

interface Opts {
	sortPredicate?: <T>(a: T, b: T) => number;
	searchOnKeys?: string[];
}

export function fuzzyFind<T>(
	list: T[],
	query: string,
	opts?: Opts,
): Array<Fuse.FuseResult<T>> | null {
	const sortPredicate = opts
		? opts.sortPredicate
		: (a: any, b: any) => a.index - b.index;

	if (query === "") {
		return null;
	}

	const f = new Fuse(list, {
		keys: opts ? opts.searchOnKeys : [],
		includeScore: false,
		includeMatches: true,
		useExtendedSearch: true,
	});

	const results = f.search<T>(query);
	return results;
}

// fuzzyFind([
//   { index: 1, title: 'foo', url: 'https://foo1.com' },
//   { index: 1, title: 'foo', url: 'https://foo2.com' },
//   { index: 1, title: 'foo', url: 'https://foo3.com' },
// ], 'foo1', { sortPredicate: (a: any, b: any) => a.index - b.index, searchOnKeys: ['index', 'title', 'url'] })

// function fuzzyFindTabs(list: []Record<string,any>, query: string): TabsCollection {
//   const sortPredicate = (a: any, b: any) => a.index - b.index
//
//   if (query === '') {
//     return list
//   }
//
//   const data = proxyToObject(list.data)
//
//   if (query.startsWith('`')) {
//     const bTabs = Object.keys(marks.tabToMarks).filter(i => i in data).map(tabId => {
//       const tid = Number(tabId)
//       return {
//         ...list.data[tid],
//         cc_extras: { ...marks.tabToMarks[tid], mark: '`' + marks.tabToMarks[tid].mark },
//       }
//     })
//
//     const qt = query.slice(1).toUpperCase()
//     if (qt === '') {
//       return {
//         list: bTabs.sort(sortPredicate).map(tab => tab.id).filter((item: number | undefined): item is number => item !== undefined),
//         data: bTabs.reduce((acc, curr) => {
//           if (curr.id == null) {
//             return acc
//           }
//           return { ...acc, [curr.id]: curr }
//         }, {}),
//       }
//     }
//
//     const f = new Fuse(bTabs, {
//       // keys: ['cc_extras.bookmark', 'index', 'title', 'url'],
//       keys: ['cc_extras.mark'],
//       includeScore: false,
//       includeMatches: true,
//       useExtendedSearch: true,
//       minMatchCharLength: 0,
//     })
//
//     const results = f.search(query.slice(1).toUpperCase())
//
//     return {
//       list: results?.sort(sortPredicate).map(result => result.item.id).filter((item: number | undefined): item is number => item !== undefined),
//       data: results?.reduce((acc, curr) => {
//         if (curr.item.id == null) {
//           return acc
//         }
//         return { ...acc, [curr.item.id]: curr }
//       }, {}),
//     }
//   }
//
//   const f = new Fuse(Object.values(list.data), {
//     keys: ['index', 'title', 'url'],
//     includeScore: false,
//     includeMatches: true,
//     useExtendedSearch: true,
//   })
//
//   const results = f.search(query)
//
//   return {
//     list: results.sort(sortPredicate).map(result => result.item.id).filter((item: number | undefined): item is number => item !== undefined),
//     data: results.reduce((acc, curr) => {
//       if (curr.item.id == null) {
//         return acc
//       }
//       return { ...acc, [curr.item.id]: curr }
//     }, {}),
//   }
// }
