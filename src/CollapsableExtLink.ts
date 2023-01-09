import { CollapsableItem } from './CollapsableItem'
import { Collapsable, CollapsableEvent } from './Collapsable'

export class CollapsableExtLink {
	private readonly collapsable: Collapsable

	public readonly extLink: HTMLElement
	public readonly collapsableItem: CollapsableItem

	private listener: EventListener | undefined

	public constructor(collapsable: Collapsable, link: HTMLAnchorElement) {
		this.collapsable = collapsable

		if (link.tagName.toLowerCase() !== 'a') {
			throw new Error(`Collapsable: External link has to be HTMLAnchorElement.'`)
		}

		const hash = link.getAttribute('href')?.substring(1)
		const collapsableItem: CollapsableItem | undefined = this.collapsable.getItemById(hash)

		if (!collapsableItem) {
			throw new Error(`Collapsable: External link has no associated collapsable item.'`)
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

			const dispatchEvent: CollapsableEvent = new CustomEvent(options.event, {
				bubbles: true,
				detail: { collapsableEvent: event }
			})

			if (this.collapsableItem.isExpanded) {
				this.collapsableItem.collapse(dispatchEvent, null, false)
			} else {
				this.collapsableItem.expand(dispatchEvent, null, false)
			}
		}

		this.extLink.addEventListener('click', this.listener)
	}

	public toggleClass(expanded: boolean): void {
		const { options } = this.collapsable

		this.extLink.classList.toggle(options.classNames.externalLinkActive, expanded)
	}

	public destroy(): void {
		if (this.listener) {
			this.extLink.removeEventListener('click', this.listener)
		}
	}
}
