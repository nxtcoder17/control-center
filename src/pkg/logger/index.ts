export interface Logger {
	debug: (msg: string, ...kv) => void;
	info: (msg: string, ...kv) => void;
	warn: (msg: string, ...kv) => void;
	error: (err: Error, msg?: string) => void;
}

export function newLogger(name?: string): Logger {
	console.log(`
 ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗          ██████╗███████╗███╗   ██╗████████╗███████╗██████╗ 
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║         ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗
██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║         ██║     █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║         ██║     ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗
╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗    ╚██████╗███████╗██║ ╚████║   ██║   ███████╗██║  ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝     ╚═════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝

  - to enable verbose debug logging, set \`globalThis.control_center_debug = true\`
`);

	const prefix = name ? `control-center/${name}` : "control-center";

	if (import.meta.env.VITE_RUN_MODE === "dev" && globalThis != null) {
		globalThis.control_center_debug = true;
	}

	const styleMap = {
		DEBUG:
			"background: #9CA3AF; color: black; padding: 2px 4px; border-radius: 2px;",
		INFO: "background: #2563EB; color: white; padding: 2px 4px; border-radius: 2px;",
		WARN: "background: #F59E0B; color: black; padding: 2px 4px; border-radius: 2px;",
		ERROR:
			"background: #DC2626; color: white; padding: 2px 4px; border-radius: 2px;",
		PREFIX: "color: gray;",
		RESET: "",
	};

	return {
		debug: (msg: string, ...kv) => {
			if (globalThis.control_center_debug) {
				console.debug(
					`%cDEBUG%c [${prefix}]%c ${msg}`,
					styleMap.DEBUG,
					styleMap.PREFIX,
					styleMap.RESET,
					...kv,
				);
				// console.debug(`[${prefix}] ${msg} |`, ...kv);
			}
		},
		info: (msg: string, ...kv) => {
			console.info(
				`%cINFO%c [${prefix}]%c ${msg}`,
				styleMap.INFO,
				styleMap.PREFIX,
				styleMap.RESET,
				...kv,
			);
			// console.info(`[${prefix}] ${msg} |`, ...kv);
		},
		warn: (msg: string, ...kv) => {
			console.warn(
				`%cWARN%c [${prefix}]%c ${msg}`,
				styleMap.INFO,
				styleMap.PREFIX,
				styleMap.RESET,
				...kv,
			);
			// console.warn(`[${prefix}] ${msg} |`, ...kv);
		},
		error: (err: Error, msg?: string, ...kv) => {
			console.error(
				`%cERROR%c [${prefix}]%c ${msg}`,
				styleMap.INFO,
				styleMap.PREFIX,
				styleMap.RESET,
				{ error: err },
				...kv,
			);
			// console.error(`[${prefix}] ${msg} |`, { error: err }, ...kv);
		},
	};
}
