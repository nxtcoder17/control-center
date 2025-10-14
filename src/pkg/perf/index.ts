if (!globalThis.perf) {
	globalThis.perf = {
		counter: {},
	};
}

if (!globalThis.perf.counter) {
	globalThis.perf.counter = {};
}

export function count(key: string) {
	if (!(key in globalThis.perf.counter)) {
		globalThis.perf.counter[key] = 1;
		return;
	}
	globalThis.perf.counter[key] += 1;
}
