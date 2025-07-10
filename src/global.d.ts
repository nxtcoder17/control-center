import type { Logger } from "./pkg/logger";

declare global {
	var logger: Logger;
	var control_center_debug: boolean;
}
