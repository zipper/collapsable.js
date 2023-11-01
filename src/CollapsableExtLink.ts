import { CollapsableItem } from './CollapsableItem'
import { Collapsable } from './Collapsable'

export class CollapsableExtLink {
	private readonly collapsable: Collapsable

	public readonly extLink: HTMLAnchorElement
	public readonly collapsableItem: CollapsableItem

	private listener: EventListener | undefined
	private ariaPerRole!: 'aria-expanded' | 'aria-selected' // always set by `this.prepareDOM()` called from constructor

	public constructor(collapsable: Collapsable, link: HTMLAnchorElement, collapsableItem: CollapsableItem) {
		this.collapsable = collapsable

		if (!(link instanceof HTMLAnchorElement)) {
			throw new Error('Collapsable: External link has to be HTMLAnchorElement.')
		}

		this.extLink = link
		this.collapsableItem = collapsableItem

		this.prepareDOM()
		this.addHandler()
	}

	private prepareDOM(): void {
		this.extLink.setAttribute('aria-controls', this.collapsableItem.boxElements.map((box) => box.id).join(' '))

		if (!this.extLink.role) {
			this.extLink.role = 'button'
		}

		if (this.extLink.role === 'button') {
			this.ariaPerRole = 'aria-expanded'
		} else if (this.extLink.role === 'tab') {
			this.ariaPerRole = 'aria-selected'
		}

		this.extLink.setAttribute(this.ariaPerRole, String(this.collapsableItem.isExpanded))
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
		this.extLink.setAttribute(this.ariaPerRole, String(this.collapsableItem.isExpanded))
	}

	public destroy(): void {
		if (this.listener) {
			this.extLink.removeEventListener('click', this.listener)
			this.extLink.removeAttribute('aria-controls')
			this.extLink.removeAttribute(this.ariaPerRole)
		}
	}
}
