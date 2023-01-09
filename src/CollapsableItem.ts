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
	collapsableItem?: CollapsableItem
}

export class CollapsableItem {
	private readonly collapsable: Collapsable
	private readonly item: HTMLCollapsableItem

	private readonly className = 'js-collapsable'
	public isExpanded = true

	public readonly id

	public readonly controlElements: HTMLElement[]
	public readonly controlLinkElements: HTMLElement[]
	public readonly boxElements: HTMLElement[]

	private listenersMap: ListenersMapItem[] = []

	public constructor(collapsable: Collapsable, element: HTMLElement) {
		this.collapsable = collapsable
		this.item = element as HTMLCollapsableItem

		this.id = element.id || getUid()

		const controlElements = element.querySelectorAll<HTMLElement>(collapsable.options.control)
		const boxElements = element.querySelectorAll<HTMLElement>(collapsable.options.box)

		if (!controlElements || !boxElements) {
			throw new Error(`Collapsable: Missing control or box element.'`)
		}

		this.controlElements = Array.from(controlElements)
		this.controlLinkElements = []
		this.boxElements = Array.from(boxElements)

		this.prepareDOM()
		this.addHandlers()

		this.item.collapsableItem = this
	}

	private prepareDOM() {
		if (!this.item.id) {
			this.item.id = this.id
		}

		const ariaControlsAttr: string[] = []
		this.boxElements.forEach((box, index) => {
			const boxItemId = box.id || `${this.item.id}-ca-box-${index}`

			box.id = boxItemId

			ariaControlsAttr.push(boxItemId)
		})

		this.controlElements.forEach((control) => {
			let link

			// a.ca-control -> add class .ca-link
			if (control.tagName.toLowerCase() === 'a') {
				link = control
			}
			// .ca-control a -> add class .ca-link
			else if ((link = control.querySelector('a'))) {
				// noop
			}
			// no anchor found, create custom
			else {
				link = document.createElement('a')
				link.dataset.caCreated = 'true'
				link.href = '#'
				link.innerHTML = control.outerHTML
				control.replaceWith(link)
			}

			link.classList.add(`${this.className}__link`)
			link.setAttribute('aria-controls', ariaControlsAttr.join(' '))

			if (link.getAttribute('href') === '#') {
				link.setAttribute('href', `#${this.item.id}`)
			}

			this.controlLinkElements.push(link)
		})
	}

	private addHandlers() {
		const { options } = this.collapsable
		const listener = (event: CustomEvent) => {
			const passEvent = event.detail.collapsableEvent ?? event

			if (options.preventDefault) {
				event.preventDefault()
			}

			if (this.isExpanded) {
				this.collapse(passEvent, null, false)
			} else {
				this.expand(passEvent, null, false)
			}
		}

		this.controlLinkElements.forEach((link) => {
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

		this.isExpanded = action === 'expand'

		const extLinks = this.collapsable.getExtLinkById(this.id)
		extLinks.forEach((extLink) => extLink.toggleClass(this.isExpanded))

		this.controlLinkElements.forEach((link) => link.setAttribute('aria-expanded', String(action === 'expand')))
		this.boxElements.forEach((box) => {
			box.setAttribute('aria-hidden', String(action !== 'expand'))

			if (action === 'collapse') {
				box.setAttribute('hidden', 'true')
			} else {
				box.removeAttribute('hidden')
			}
		})

		this.item.classList.remove(removeClass)
		this.item.classList.add(addClass)

		setTimeout(() => {
			this.item.dispatchEvent(finishedEvent)
		}, options.fxDuration)

		return true
	}

	public expand(collapsableEvent: any, data: any, force: boolean): boolean {
		const { options } = this.collapsable
		const expandedItem = this.collapsable.getExpanded() // accordion -> max one expanded item

		this.collapsable.promiseOpen = true // allows us to collapse expanded item even if there might be collapseAll === false option

		// if accordion, we have to collapse previously opened item before expanding; if accordion element hasn't collapsed, we can't continue
		if (options.accordion && expandedItem.length && !expandedItem[0].collapse(collapsableEvent, data, force)) {
			this.collapsable.promiseOpen = false
			return false
		}

		this.collapsable.promiseOpen = false

		const event = new CustomEvent('expand.collapsable', {
			bubbles: true,
			detail: {
				data,
				collapsableEvent
			}
		})
		this.item.dispatchEvent(event)

		if (event.defaultPrevented && !force) {
			// collapsableAll === false && accordion === true -> if the box has not opened, we must make sure something is opened, therefore we force-open previously opened box (options.accordion is true means we tried to collapse something), simulating it has never closed in first place
			if (!options.collapsableAll && options.accordion) {
				expandedItem[0].expand(collapsableEvent, data, true)
			}

			return false
		}

		return this.handleExpandCollapse('expand', collapsableEvent, data)
	}

	public collapse(collapsableEvent: any, data: any, force: boolean): boolean {
		const { options } = this.collapsable

		// if we can't collapse all, we are not promised to open something and there is only one opened box, then we can't continue
		if (!options.collapsableAll && !this.collapsable.promiseOpen && this.collapsable.getExpanded().length < 2) {
			return false
		}

		const event = new CustomEvent('collapse.collapsable', {
			bubbles: true,
			detail: {
				data,
				collapsableEvent
			}
		})
		this.item.dispatchEvent(event)

		if (event.defaultPrevented && !force) {
			return false
		}

		return this.handleExpandCollapse('collapse', collapsableEvent, data)
	}

	public isDefaultExpanded(): boolean {
		return this.item.classList.contains(this.collapsable.options.classNames.defaultExpanded)
	}

	public destroy(): void {
		const { options } = this.collapsable

		// remove classes and event handlers from main element
		this.item.classList.remove(options.classNames.collapsed)
		this.item.classList.remove(options.classNames.expanded)
		delete this.item.collapsableItem

		this.listenersMap.forEach(({ element, eventName, listener }) => {
			element.removeEventListener(eventName, listener)
		})

		this.controlLinkElements.forEach((link) => {
			if (link.dataset.caCreated && link.parentElement) {
				link.parentElement.innerHTML = link.innerHTML
			} else {
				link.classList.remove(`${this.className}__link`)
				link.removeAttribute('aria-controls')
				link.removeAttribute('aria-expanded')
			}
		})

		this.boxElements.forEach((box) => {
			box.removeAttribute('aria-hidden')
			box.removeAttribute('hidden')
		})

		this.item.dispatchEvent(new CustomEvent('destroy.collapsable', { bubbles: true }))
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
}
