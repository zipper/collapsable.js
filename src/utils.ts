// Deep Partial type
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

// Deep merge of objects
function isObject(item: unknown) {
	return item && typeof item === 'object' && !Array.isArray(item)
}

export function deepMerge(target: any, ...sources: any): Record<string, unknown> {
	if (!sources.length) return target
	const source = sources.shift()

	if (isObject(target) && isObject(source)) {
		for (const key in source) {
			if (isObject(source[key])) {
				if (!target[key]) Object.assign(target, { [key]: {} })
				deepMerge(target[key], source[key])
			} else {
				Object.assign(target, { [key]: source[key] })
			}
		}
	}

	return deepMerge(target, ...sources)
}

// UID for CollapsableItem
export let caUid = 0

export function getUid() {
	return 'ca-uid-' + caUid++
}
