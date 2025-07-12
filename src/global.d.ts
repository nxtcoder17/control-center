import type { Logger } from "./pkg/logger";

interface Perf {
	counter: Record<string, number>;
}

declare global {
	var logger: Logger;
	var control_center_debug: boolean;
	var perf: Perf;
}
