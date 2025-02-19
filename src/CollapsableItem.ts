import { Collapsable, CollapsableEvent } from './Collapsable'
import { getUid } from './utils'

type CollapsableItemAction = 'expand' | 'collapse'
type CollapsableItemEvents =
	| 'expand.collapsable'
	| 'collapse.collapsable'
	| 'expanded.collapsable'
	| 'collapsed.collapsable'
	| 'destroy.collapsable'

type ListenersMapItem = {
	element: HTMLElement
	eventName: string
	listener: EventListener
}

export interface HTMLCollapsableItem extends HTMLElement {
	collapsableItem: CollapsableItem
}

export class CollapsableItem {
	public readonly collapsable: Collapsable

	public readonly id: string

	public readonly element: HTMLCollapsableItem
	public readonly controlElements: HTMLElement[]
	public readonly controlInteractiveElements: HTMLElement[]
	public readonly boxElements: HTMLElement[]

	public readonly media: MediaQueryList | null = null

	private _isExpanded = true

	private listenersMap: ListenersMapItem[] = []

	public constructor(collapsable: Collapsable, element: HTMLElement) {
		this.collapsable = collapsable

		this.id = element.id || getUid()

		const controlElements = element.querySelectorAll<HTMLElement>(collapsable.options.control)
		const boxElements = element.querySelectorAll<HTMLElement>(collapsable.options.box)

		if (!boxElements.length) {
			throw new Error(`Collapsable: Missing control or box element.'`)
		}

		this.element = element as HTMLCollapsableItem

		const mediaString = element.dataset.collapsableMediaQuery
		if (mediaString) {
			this.media = window.matchMedia(mediaString)
			this.media.addEventListener('change', this.handleMediaChange.bind(this))
		}

		this.controlElements = Array.from(controlElements)
		this.controlInteractiveElements = []
		this.boxElements = Array.from(boxElements)

		if (!this.media || this.media.matches) {
			this.initialize()
		}

		this.element.collapsableItem = this
	}

	private prepareDOM() {
		const { options } = this.collapsable

		if (!this.element.id) {
			this.element.id = this.id
		}

		const ariaControlsAttr: string[] = []
		this.boxElements.forEach((box, index) => {
			const boxItemId = box.id || `${this.element.id}-ca-box-${index}`

			box.id = boxItemId

			ariaControlsAttr.push(boxItemId)
		})

		this.controlElements.forEach((control) => {
			let interactiveElement

			const tagName = control.tagName.toLowerCase()

			if (tagName === 'button' || tagName === 'a') {
				interactiveElement = control
			} else if ((interactiveElement = control.querySelector<HTMLElement>('button, a'))) {
				// noop
			} else {
				interactiveElement = document.createElement('button')
				interactiveElement.type = 'button'
				interactiveElement.dataset.caCreated = 'true'
				interactiveElement.innerHTML = control.innerHTML
				control.replaceChildren(interactiveElement)
			}

			interactiveElement.classList.add(options.classNames.interactiveElement)
			interactiveElement.setAttribute('aria-controls', ariaControlsAttr.join(' '))

			if (interactiveElement.tagName.toLowerCase() === 'a') {
				interactiveElement.setAttribute('role', 'button')
			}

			if (interactiveElement.getAttribute('href') === '#') {
				interactiveElement.setAttribute('href', `#${this.element.id}`)
			}

			this.controlInteractiveElements.push(interactiveElement)
		})
	}

	private addHandlers() {
		const { options } = this.collapsable
		const listener = (event: CustomEvent) => {
			const passEvent = event.detail.collapsableEvent ?? event

			if (options.preventDefault) {
				event.preventDefault()
			}

			if (this._isExpanded) {
				this.collapse(passEvent, null, false)
			} else {
				this.expand(passEvent, null, false)
			}
		}

		this.controlInteractiveElements.forEach((link) => {
			link.addEventListener(options.event, listener as EventListener)
			this.listenersMap.push({
				element: link,
				eventName: options.event,
				listener: listener as EventListener
			})
		})
	}

	/**
	 * Handling common parts of expanding and collapsing
	 */
	private handleExpandCollapse(action: CollapsableItemAction, collapsableEvent: any, data: any): boolean {
		const { options } = this.collapsable
		let eventName: CollapsableItemEvents = 'expanded.collapsable'
		let addClass = options.classNames.expanded
		let removeClass = options.classNames.collapsed

		// capitalize first letter
		if (action === 'collapse') {
			eventName = 'collapsed.collapsable'
			addClass = options.classNames.collapsed
			removeClass = options.classNames.expanded
		}

		const finishedEvent: CollapsableEvent = new CustomEvent(eventName, {
			bubbles: true,
			detail: {
				data,
				collapsableEvent
			}
		})

		this._isExpanded = action === 'expand'

		const extLinks = this.collapsable.getExtLinkById(this.id)
		extLinks.forEach((extLink) => extLink.toggleClass())

		this.controlInteractiveElements.forEach((link) => link.setAttribute('aria-expanded', String(action === 'expand')))
		this.boxElements.forEach((box) => {
			box.setAttribute('aria-hidden', String(action !== 'expand'))

			if (action === 'collapse') {
				box.setAttribute('hidden', 'true')
			} else {
				box.removeAttribute('hidden')
			}
		})

		this.element.classList.remove(removeClass)
		this.element.classList.add(addClass)

		setTimeout(() => {
			this.element.dispatchEvent(finishedEvent)
		}, options.fxDuration)

		return true
	}

	public expand(collapsableEvent: any, data: any, force: boolean): boolean {
		// If the item is already expanded, return, unless it is initialisation, where the item is considered expanded
		// by default, but may not have all its attributes set.
		if (this.isExpanded && collapsableEvent.type !== 'init.collapsable') {
			return false
		}

		const { options } = this.collapsable
		const expandedItem = this.collapsable.getExpanded()

		// This allows us to collapse expanded item even if there might be collapseAll === false option
		this.collapsable.promiseOpen = true

		// If accordion, we have to collapse previously opened item before expanding; if accordion element hasn't
		// collapsed, we can't continue
		if (options.accordion && expandedItem.length && !expandedItem[0].collapse(collapsableEvent, data, force)) {
			this.collapsable.promiseOpen = false
			return false
		}

		this.collapsable.promiseOpen = false

		const event = new CustomEvent('expand.collapsable', {
			bubbles: true,
			cancelable: true,
			detail: {
				data,
				collapsableEvent
			}
		})
		this.element.dispatchEvent(event)

		if (event.defaultPrevented && !force) {
			// collapsableAll === false && accordion === true -> if the box has not opened, we must make sure something
			// remained open, therefore we force-open previously opened box (options.accordion === true means we tried
			// to collapse something), simulating it has never closed in first place
			if (!options.collapsableAll && options.accordion) {
				expandedItem[0].expand(collapsableEvent, data, true)
			}

			return false
		}

		return this.handleExpandCollapse('expand', collapsableEvent, data)
	}

	public collapse(collapsableEvent: any, data: any, force: boolean): boolean {
		const { options } = this.collapsable

		// If the item is not expanded, or if we can't collapse all & we are not promised to open something & there is
		// only one opened box, we can't continue. Also when media query doesn't match, we don't want to collapse the
		// item.
		if (
			(this.media && !this.media.matches) ||
			!this.isExpanded ||
			(!options.collapsableAll && !this.collapsable.promiseOpen && this.collapsable.getExpanded().length < 2)
		) {
			return false
		}

		const event = new CustomEvent('collapse.collapsable', {
			bubbles: true,
			cancelable: true,
			detail: {
				data,
				collapsableEvent
			}
		})
		this.element.dispatchEvent(event)

		if (event.defaultPrevented && !force) {
			return false
		}

		return this.handleExpandCollapse('collapse', collapsableEvent, data)
	}

	public get isDefaultExpanded(): boolean {
		// If CollapsableItem uses conditional media query initialization, it is considered NOT expanded for the
		// purposes of parent Collapsable even though it actually is. This is an edge case for when group of Collapsable
		// uses collapsableAll option and some of the items are collapsable only at certain breakpoints.
		if (this.media && !this.media.matches) {
			return false
		}

		const defaultExpandedClass = this.element.classList.contains(this.collapsable.options.classNames.defaultExpanded)
		const mediaDataset = this.element.dataset.collapsableDefaultExpandedMedia

		if (defaultExpandedClass || !mediaDataset) {
			return defaultExpandedClass
		}

		const defaultExpandedMedia = window.matchMedia(mediaDataset)

		return defaultExpandedMedia.matches || defaultExpandedClass
	}

	public get isExpanded(): boolean {
		return this._isExpanded
	}

	private handleMediaChange(event: MediaQueryListEvent): void {
		if (event.matches) {
			this.initialize()
			this.collapsable.handleDefaultExpanded()
		} else {
			this.destroy()
		}
	}

	private initialize(): void {
		this.prepareDOM()
		this.addHandlers()
	}

	public destroy(): void {
		const { options } = this.collapsable

		// After destruction, the item is considered expanded. This is important for possible re-initialization if
		// collapsable uses conditional initialization with media queries.
		this._isExpanded = true

		this.element.classList.remove(options.classNames.collapsed)
		this.element.classList.remove(options.classNames.expanded)

		this.listenersMap.forEach(({ element, eventName, listener }) => {
			element.removeEventListener(eventName, listener)
		})

		this.controlInteractiveElements.forEach((interactiveElement) => {
			if (interactiveElement.dataset.caCreated && interactiveElement.parentElement) {
				interactiveElement.parentElement.innerHTML = interactiveElement.innerHTML
			} else {
				interactiveElement.classList.remove(options.classNames.interactiveElement)
				interactiveElement.removeAttribute('aria-controls')
				interactiveElement.removeAttribute('aria-expanded')
			}
		})

		this.boxElements.forEach((box) => {
			box.removeAttribute('aria-hidden')
			box.removeAttribute('hidden')
		})

		this.element.dispatchEvent(new CustomEvent('destroy.collapsable', { bubbles: true }))
	}
}

declare global {
	interface HTMLElementEventMap {
		'expand.collapsable': CollapsableEvent
		'expanded.collapsable': CollapsableEvent
		'collapse.collapsable': CollapsableEvent
		'collapsed.collapsable': CollapsableEvent
		'destroy.collapsable': CustomEvent
	}

	interface DocumentEventMap {
		'expand.collapsable': CollapsableEvent
		'expanded.collapsable': CollapsableEvent
		'collapse.collapsable': CollapsableEvent
		'collapsed.collapsable': CollapsableEvent
		'destroy.collapsable': CustomEvent
	}
}
