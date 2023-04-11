// Deep Partial type
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

// Deep merge of objects
export function deepMerge<T extends Record<string, any>>(out: T, ...args: (Record<string, any> | undefined)[]): T {
	if (!out) {
		return {} as T
	}

	for (const obj of args) {
		if (!obj) {
			continue
		}

		for (const [key, value] of Object.entries(obj)) {
			switch (Object.prototype.toString.call(value)) {
				case '[object Object]':
					out[key as keyof T] = out[key as keyof T] || ({} as T[keyof T])
					out[key as keyof T] = deepMerge(out[key as keyof T], value)
					break
				case '[object Array]':
					out[key as keyof T] = deepMerge(new Array(value.length) as T[keyof T], value)
					break
				default:
					out[key as keyof T] = value
			}
		}
	}

	return out
}

// UID for CollapsableItem
export let caUid = 0

export function getUid() {
	return 'ca-uid-' + caUid++
}
