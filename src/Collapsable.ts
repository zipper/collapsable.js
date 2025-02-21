import { CollapsableItem } from './CollapsableItem'
import { DeepPartial, deepMerge } from './utils'
import { CollapsableExtLink } from './CollapsableExtLink'

export type CollapsableOptions = {
	control: string
	box: string
	event: string
	preventDefault: boolean
	fxDuration: number
	accordion: boolean
	collapsableAll: boolean
	externalLinks: {
		selector: string
		preventDefault: boolean
	}
	classNames: {
		interactiveElement: string
		expanded: string
		collapsed: string
		defaultExpanded: string
		externalLinkActive: string
	}
}

export type CollapsableEvent = CustomEvent<{ collapsableEvent: CustomEvent | Event; data?: any }>

export class Collapsable {
	public readonly options: CollapsableOptions
	public promiseOpen: boolean

	public readonly items: CollapsableItem[] = []
	private extLinks: CollapsableExtLink[] = []
	private defaultExpandedItem: CollapsableItem[] = []

	private readonly defaults: CollapsableOptions = {
		control: '.js-collapsable__control:not(:scope .js-collapsable .js-collapsable__control)',
		box: '.js-collapsable__box:not(:scope .js-collapsable .js-collapsable__box)',
		event: 'click',
		preventDefault: true,

		// Duration of the effect, affects delay between `expand.collapsable`(`collapse.collapsable`) and
		// `expanded.collapsable` (`collapsed.collapsable`) events are triggered.
		fxDuration: 0,

		// Determines, if there could be more than one expanded box in same time.
		accordion: false,

		// Is it possible to collapsable (close) all elements from giver collapsable set?
		collapsableAll: true,

		// External links for operating collapsable set. These could be anywhere in the DOM.
		externalLinks: {
			// CSS selector for external links. Has to be HTMLAnchorElement, click event is bound.
			selector: '.js-collapsable-ext-link',

			// Whether preventDefault is called on extLinks click
			preventDefault: false
		},

		// CSS class names used by the plugin
		classNames: {
			// This class is added to buttons (or links) inside the control elements (or the control element itself, if it is button/link).
			interactiveElement: 'js-collapsable__button',

			// Expanded / collapsed class on collapsable items.
			expanded: 'js-collapsable--expanded',
			collapsed: 'js-collapsable--collapsed',

			// Collapsable item with this class will be expanded on init.
			defaultExpanded: 'js-collapsable--default-expanded',

			// Class added to external link, when its collapsable item is expanded.
			externalLinkActive: 'js-collapsable-ext-link--active'
		}
	}

	public constructor(elements: HTMLElement | NodeListOf<HTMLElement>, options?: DeepPartial<CollapsableOptions>) {
		this.options = deepMerge({}, this.defaults, options) as CollapsableOptions
		this.promiseOpen = false

		if (elements instanceof NodeList) {
			elements.forEach(this.initializeItem.bind(this))
		} else {
			this.initializeItem(elements)
		}

		this.handleExternalLinks()

		this.handleDefaultExpanded()
	}

	private initializeItem(element: HTMLElement): void {
		const item = new CollapsableItem(this, element)

		if (item) {
			this.items.push(item)
		}
	}

	private handleExternalLinks(): void {
		const { options } = this

		if (!options.externalLinks.selector) {
			return
		}

		const extLinks = document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(options.externalLinks.selector)

		extLinks.forEach((element) => {
			const hash = element instanceof HTMLAnchorElement ? element.hash.substring(1) : element.dataset.collapsableId
			const collapsableItem = this.getItemById(hash)

			if (!collapsableItem) {
				return
			}

			this.extLinks.push(new CollapsableExtLink(this, element, collapsableItem))
		})
	}

	private prepareDefaultExpanded(): void {
		const { options } = this
		const hash = window.location.hash.substring(1)

		const defaultExpanded = this.items.filter((item) => item.isDefaultExpanded)
		const defaultExpandedFromUrl = hash ? this.items.find((item) => item.id === hash) : undefined

		if (defaultExpandedFromUrl) {
			this.defaultExpandedItem.push(defaultExpandedFromUrl)
		}

		if (defaultExpanded.length) {
			this.defaultExpandedItem.push(...defaultExpanded)
		}

		if (options.accordion) {
			this.defaultExpandedItem = this.defaultExpandedItem.slice(0, 1)
		}

		// If no default expanded is provided and options.collapsableAll === false, we choose first item
		if (this.defaultExpandedItem.length === 0 && !options.collapsableAll) {
			this.defaultExpandedItem.push(this.items[0])
		}
	}

	public handleDefaultExpanded(): void {
		this.prepareDefaultExpanded()

		const { options } = this
		const collapsableEvent = new CustomEvent('init.collapsable', { bubbles: true })

		const force = !options.collapsableAll
		this.defaultExpandedItem.forEach((item) => {
			item.expand(collapsableEvent, null, force)
		})

		this.items
			.filter((item) => !this.defaultExpandedItem.includes(item))
			.forEach((item) => {
				item.collapse(collapsableEvent, null, true)
			})
	}

	public getExtLinkById(id?: string): CollapsableExtLink[] {
		return this.extLinks.filter((item) => item.collapsableItem.id === id)
	}

	public getItemById(id?: string): CollapsableItem | undefined {
		return this.items.find((item) => item.id === id)
	}

	public getExpanded(): CollapsableItem[] {
		return this.items.filter((item) => item.isExpanded)
	}

	public expandAll(data?: any): void {
		const { options } = this

		// If accordion, we only want to expand one (first) box, or none if already expanded
		if (options.accordion && this.getExpanded().length) {
			return
		}

		const collapsableEvent = new CustomEvent('expandAll.collapsable')

		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i]
			if (item.isExpanded) {
				continue
			}

			const hasExpanded = item.expand(collapsableEvent, data, false)

			if (options.accordion && hasExpanded) {
				break
			}
		}
	}

	public collapseAll(data?: any): void {
		const collapsableEvent = new CustomEvent('collapseAll.collapsable')

		this.getExpanded().forEach((item) => {
			item.collapse(collapsableEvent, data, false)
		})
	}

	public destroy(): void {
		this.items.forEach((item) => item.destroy())
		this.extLinks.forEach((link) => link.destroy())
	}
}
