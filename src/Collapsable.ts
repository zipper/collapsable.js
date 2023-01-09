import { CollapsableItem } from './CollapsableItem'
import { DeepPartial, mergeDeep } from './utils'
import { CollapsableExtLink } from './CollapsableExtLink'

export type CollapsableOptions = {
	control: string
	box: string
	event: string
	preventDefault: boolean
	fxDuration: 0
	accordion: boolean
	collapsableAll: boolean
	externalLinks: {
		selector: string
		preventDefault: boolean
	}
	classNames: {
		expanded: string
		collapsed: string
		defaultExpanded: string
		externalLinkActive: string
	}
}

export type CollapsableEvent = CustomEvent<{ collapsableEvent: CustomEvent | Event; data?: any }>

export class Collapsable {
	public options: CollapsableOptions
	public promiseOpen: boolean

	private extLinks: CollapsableExtLink[] = []
	private items: CollapsableItem[] = []
	private defaultExpandedItem: CollapsableItem[] = []

	private readonly defaults: CollapsableOptions = {
		control: '.js-collapsable__control',
		box: '.js-collapsable__box',
		event: 'click',
		preventDefault: true,

		fxDuration: 0, // duration of the effect, affects delay between `expand.collapsable`(`collapse.collapsable`) and `expanded.collapsable` (`collapsed.collapsable`) evetns are triggered; default value is 500 when fx set to slide

		accordion: false, // determines, if there could be more than one expanded box in same time; related to jQuery set on which initialized
		collapsableAll: true, // possibility of collapsing all boxes from set

		externalLinks: {
			// external links for operating collapsable set, can be anywhere else in DOM
			selector: '.js-collapsable-ext-link', // CSS selector for external links; it has to be anchors; the click event is binded
			preventDefault: false // whether preventDefault is called on extLinks click
		},

		classNames: {
			// CSS class names to be used on collapsable box; they are added to element, on which collapsable has been called
			expanded: 'js-collapsable--expanded',
			collapsed: 'js-collapsable--collapsed',
			defaultExpanded: 'js-collapsable--default-expanded',
			externalLinkActive: 'js-collapsable-ext-link--active'
		}
	}

	public constructor(elements: NodeListOf<HTMLElement>, options?: DeepPartial<CollapsableOptions>) {
		this.options = mergeDeep({}, this.defaults, options) as CollapsableOptions
		this.promiseOpen = false

		elements.forEach((element) => {
			const item = new CollapsableItem(this, element)

			if (item) {
				this.items.push(item)
			}
		})

		this.handleExternalLinks()

		this.prepareDefaultExpanded()
		this.handleDefaultExpanded()
	}

	private handleExternalLinks(): void {
		const { options } = this

		if (!options.externalLinks.selector) {
			return
		}

		const extLinks = document.querySelectorAll<HTMLAnchorElement>(options.externalLinks.selector)

		extLinks.forEach((element) => {
			const extLink = new CollapsableExtLink(this, element)

			if (extLink) {
				this.extLinks.push(extLink)
			}
		})
	}

	private prepareDefaultExpanded(): void {
		const { options } = this
		const hash = window.location.hash.substring(1)

		const defaultExpanded = this.items.filter((item) => item.isDefaultExpanded())
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

		// if no default expanded is provided and options.collapsableAll === false, we choose first item
		if (this.defaultExpandedItem.length === 0 && !options.collapsableAll) {
			this.defaultExpandedItem.push(this.items[0])
		}
	}

	private handleDefaultExpanded(): void {
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

		// if accordion, we only want to expand one (first) box, or none if already expanded
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
