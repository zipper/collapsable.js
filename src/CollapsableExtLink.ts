import { CollapsableItem } from './CollapsableItem'
import { Collapsable } from './Collapsable'

export class CollapsableExtLink {
	private readonly collapsable: Collapsable

	public readonly extLink: HTMLAnchorElement | HTMLButtonElement
	public readonly collapsableItem: CollapsableItem

	private listener: EventListener | undefined
	private ariaPerRole!: 'aria-expanded' | 'aria-selected' // always set by `this.prepareDOM()` called from constructor

	public constructor(
		collapsable: Collapsable,
		link: HTMLAnchorElement | HTMLButtonElement,
		collapsableItem: CollapsableItem
	) {
		this.collapsable = collapsable

		if (!(link instanceof HTMLAnchorElement) && !(link instanceof HTMLButtonElement)) {
			throw new Error('Collapsable: External link has to be HTMLAnchorElement or HTMLButtonElement.')
		}

		this.extLink = link
		this.collapsableItem = collapsableItem

		this.prepareDOM()
		this.addHandler()
	}

	private prepareDOM(): void {
		this.extLink.setAttribute('aria-controls', this.collapsableItem.boxElements.map((box) => box.id).join(' '))

		if (this.extLink instanceof HTMLAnchorElement && !this.extLink.role) {
			this.extLink.role = 'button'
		}

		if (this.extLink instanceof HTMLButtonElement || this.extLink.role === 'button') {
			this.ariaPerRole = 'aria-expanded'
		} else if (this.extLink.role === 'tab') {
			this.ariaPerRole = 'aria-selected'
		}

		this.extLink.setAttribute(this.ariaPerRole, String(this.collapsableItem.isExpanded))
	}

	private addHandler(): void {
		const { options } = this.collapsable

		this.listener = (event: Event) => {
			if (options.externalLinks.preventDefault || this.extLink.dataset.collapsablePreventDefault !== undefined) {
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
			this.extLink.removeAttribute('role')
		}
	}
}
