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

// Remembers original attribute values before collapsable modifies them, so they can be restored on destroy.
export class AttributeSnapshot {
	private store = new Map<HTMLElement, Record<string, string | null>>()

	public remember(element: HTMLElement, name: string): void {
		let attrs = this.store.get(element)
		if (!attrs) {
			attrs = {}
			this.store.set(element, attrs)
		}
		// Only the first (original) value is stored, repeated calls won't overwrite it.
		if (!(name in attrs)) {
			attrs[name] = element.getAttribute(name)
		}
	}

	public restore(element: HTMLElement, name: string): void {
		const attrs = this.store.get(element)
		if (!attrs || !(name in attrs)) {
			return
		}
		const value = attrs[name]
		if (value === null) {
			element.removeAttribute(name)
		} else {
			element.setAttribute(name, value)
		}
	}

	public clear(): void {
		this.store.clear()
	}
}
