export interface Logger {
	debug: (msg: string, ...kv) => void;
	info: (msg: string, ...kv) => void;
	warn: (msg: string, ...kv) => void;
	error: (err: Error, msg?: string) => void;
}

function handleKV(...kv): string {
  let result = ""
  for (let i = 1; i < kv.length; i+=2) {
    result += `${kv[i-1]}=${kv[i]}`
  }

  return result
}

export function newLogger(name: string): Logger {
	return {
		debug: (msg: string, ...kv) => {
			if (kv.length >= 2) {
			  console.debug(`[${name}] ${msg}`, handleKV(...kv));
			  return
			}
			console.debug(`[${name}] ${msg}`);
		},
		info: (msg: string, ...kv) => {
			if (kv.length >= 2) {
			  console.info(`[${name}] ${msg}`, handleKV(...kv));
			  return
			}
			console.info(`[${name}] ${msg}`);
		},
		warn: (msg: string, ...kv) => {
			if (kv.length >= 2) {
			  console.warn(`[${name}] ${msg}`, handleKV(...kv));
			  return
			}
			console.warn(`[${name}] ${msg}`);
		},
		error: (err: Error, msg?: string, ...kv) => {
			if (kv.length >= 2) {
			  console.error(`[${name}] ${msg}`, handleKV(...kv));
			  return
			}
			console.error(`[${name}] ${msg}`, { error: err });
		},
	};
}
