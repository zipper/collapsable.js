import { CollapsableItem } from './CollapsableItem'
import { Collapsable } from './Collapsable'

export class CollapsableExtLink {
	private readonly collapsable: Collapsable

	public readonly extLink: HTMLElement
	public readonly collapsableItem: CollapsableItem

	private listener: EventListener | undefined

	public constructor(collapsable: Collapsable, link: HTMLAnchorElement, collapsableItem: CollapsableItem) {
		this.collapsable = collapsable

		if (link.tagName.toLowerCase() !== 'a') {
			throw new Error('Collapsable: External link has to be HTMLAnchorElement.')
		}

		this.extLink = link
		this.collapsableItem = collapsableItem

		this.addHandler()
	}

	private addHandler(): void {
		const { options } = this.collapsable

		this.listener = (event: Event) => {
			if (options.externalLinks.preventDefault) {
				event.preventDefault()
			}

			if (this.collapsableItem.isExpanded) {
				this.collapsableItem.collapse(event, null, false)
			} else {
				this.collapsableItem.expand(event, null, false)
			}
		}

		this.extLink.addEventListener('click', this.listener)
	}

	public toggleClass(): void {
		const { options } = this.collapsable

		this.extLink.classList.toggle(options.classNames.externalLinkActive, this.collapsableItem.isExpanded)
	}

	public destroy(): void {
		if (this.listener) {
			this.extLink.removeEventListener('click', this.listener)
		}
	}
}
