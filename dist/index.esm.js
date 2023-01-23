/**
 * Collapsable.js - Vanilla JS plugin for collapsable boxes 
 * http://zipper.github.io/jquery.collapsable/
 *
 * @author Radek Šerý <radek.sery@gmail.com>
 * @license MIT
 *
 * @version 3.1.0
 */

// Deep merge of objects
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
function mergeDeep(target, ...sources) {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return mergeDeep(target, ...sources);
}
// UID for CollapsableItem
let caUid = 0;
function getUid() {
    return 'ca-uid-' + caUid++;
}

class CollapsableItem {
    constructor(collapsable, element) {
        this._isExpanded = true;
        this.listenersMap = [];
        this.collapsable = collapsable;
        this.element = element;
        this.id = element.id || getUid();
        const controlElements = element.querySelectorAll(collapsable.options.control);
        const boxElements = element.querySelectorAll(collapsable.options.box);
        if (!controlElements || !boxElements) {
            throw new Error(`Collapsable: Missing control or box element.'`);
        }
        this.controlElements = Array.from(controlElements);
        this.controlInteractiveElements = [];
        this.boxElements = Array.from(boxElements);
        this.prepareDOM();
        this.addHandlers();
        this.element.collapsableItem = this;
    }
    prepareDOM() {
        const { options } = this.collapsable;
        if (!this.element.id) {
            this.element.id = this.id;
        }
        const ariaControlsAttr = [];
        this.boxElements.forEach((box, index) => {
            const boxItemId = box.id || `${this.element.id}-ca-box-${index}`;
            box.id = boxItemId;
            ariaControlsAttr.push(boxItemId);
        });
        this.controlElements.forEach((control) => {
            let interactiveElement;
            const tagName = control.tagName.toLowerCase();
            if (tagName === 'button' || tagName === 'a') {
                interactiveElement = control;
            }
            else if ((interactiveElement = control.querySelector('button, a'))) ;
            else {
                interactiveElement = document.createElement('button');
                interactiveElement.dataset.caCreated = 'true';
                interactiveElement.innerHTML = control.innerHTML;
                control.replaceChildren(interactiveElement);
            }
            interactiveElement.classList.add(options.classNames.interactiveElement);
            interactiveElement.setAttribute('aria-controls', ariaControlsAttr.join(' '));
            if (interactiveElement.tagName.toLowerCase() === 'a') {
                interactiveElement.setAttribute('role', 'button');
            }
            if (interactiveElement.getAttribute('href') === '#') {
                interactiveElement.setAttribute('href', `#${this.element.id}`);
            }
            this.controlInteractiveElements.push(interactiveElement);
        });
    }
    addHandlers() {
        const { options } = this.collapsable;
        const listener = (event) => {
            const passEvent = event.detail.collapsableEvent ?? event;
            if (options.preventDefault) {
                event.preventDefault();
            }
            if (this._isExpanded) {
                this.collapse(passEvent, null, false);
            }
            else {
                this.expand(passEvent, null, false);
            }
        };
        this.controlInteractiveElements.forEach((link) => {
            link.addEventListener(options.event, listener);
            this.listenersMap.push({
                element: link,
                eventName: options.event,
                listener: listener
            });
        });
    }
    /**
     * Handling common parts of expanding and collapsing
     */
    handleExpandCollapse(action, collapsableEvent, data) {
        const { options } = this.collapsable;
        let eventName = 'expanded.collapsable';
        let addClass = options.classNames.expanded;
        let removeClass = options.classNames.collapsed;
        // capitalize first letter
        if (action === 'collapse') {
            eventName = 'collapsed.collapsable';
            addClass = options.classNames.collapsed;
            removeClass = options.classNames.expanded;
        }
        const finishedEvent = new CustomEvent(eventName, {
            bubbles: true,
            detail: {
                data,
                collapsableEvent
            }
        });
        this._isExpanded = action === 'expand';
        const extLinks = this.collapsable.getExtLinkById(this.id);
        extLinks.forEach((extLink) => extLink.toggleClass());
        this.controlInteractiveElements.forEach((link) => link.setAttribute('aria-expanded', String(action === 'expand')));
        this.boxElements.forEach((box) => {
            box.setAttribute('aria-hidden', String(action !== 'expand'));
            if (action === 'collapse') {
                box.setAttribute('hidden', 'true');
            }
            else {
                box.removeAttribute('hidden');
            }
        });
        this.element.classList.remove(removeClass);
        this.element.classList.add(addClass);
        setTimeout(() => {
            this.element.dispatchEvent(finishedEvent);
        }, options.fxDuration);
        return true;
    }
    expand(collapsableEvent, data, force) {
        const { options } = this.collapsable;
        const expandedItem = this.collapsable.getExpanded();
        // This allows us to collapse expanded item even if there might be collapseAll === false option
        this.collapsable.promiseOpen = true;
        // If accordion, we have to collapse previously opened item before expanding; if accordion element hasn't
        // collapsed, we can't continue
        if (options.accordion && expandedItem.length && !expandedItem[0].collapse(collapsableEvent, data, force)) {
            this.collapsable.promiseOpen = false;
            return false;
        }
        this.collapsable.promiseOpen = false;
        const event = new CustomEvent('expand.collapsable', {
            bubbles: true,
            detail: {
                data,
                collapsableEvent
            }
        });
        this.element.dispatchEvent(event);
        if (event.defaultPrevented && !force) {
            // collapsableAll === false && accordion === true -> if the box has not opened, we must make sure something
            // remained open, therefore we force-open previously opened box (options.accordion === true means we tried
            // to collapse something), simulating it has never closed in first place
            if (!options.collapsableAll && options.accordion) {
                expandedItem[0].expand(collapsableEvent, data, true);
            }
            return false;
        }
        return this.handleExpandCollapse('expand', collapsableEvent, data);
    }
    collapse(collapsableEvent, data, force) {
        const { options } = this.collapsable;
        // If we can't collapse all & we are not promised to open something & there is only one opened box, we can't
        // continue
        if (!options.collapsableAll && !this.collapsable.promiseOpen && this.collapsable.getExpanded().length < 2) {
            return false;
        }
        const event = new CustomEvent('collapse.collapsable', {
            bubbles: true,
            detail: {
                data,
                collapsableEvent
            }
        });
        this.element.dispatchEvent(event);
        if (event.defaultPrevented && !force) {
            return false;
        }
        return this.handleExpandCollapse('collapse', collapsableEvent, data);
    }
    get isDefaultExpanded() {
        return this.element.classList.contains(this.collapsable.options.classNames.defaultExpanded);
    }
    get isExpanded() {
        return this._isExpanded;
    }
    destroy() {
        const { options } = this.collapsable;
        this.element.classList.remove(options.classNames.collapsed);
        this.element.classList.remove(options.classNames.expanded);
        delete this.element.collapsableItem;
        this.listenersMap.forEach(({ element, eventName, listener }) => {
            element.removeEventListener(eventName, listener);
        });
        this.controlInteractiveElements.forEach((interactiveElement) => {
            if (interactiveElement.dataset.caCreated && interactiveElement.parentElement) {
                interactiveElement.parentElement.innerHTML = interactiveElement.innerHTML;
            }
            else {
                interactiveElement.classList.remove(options.classNames.interactiveElement);
                interactiveElement.removeAttribute('aria-controls');
                interactiveElement.removeAttribute('aria-expanded');
            }
        });
        this.boxElements.forEach((box) => {
            box.removeAttribute('aria-hidden');
            box.removeAttribute('hidden');
        });
        this.element.dispatchEvent(new CustomEvent('destroy.collapsable', { bubbles: true }));
    }
}

class CollapsableExtLink {
    constructor(collapsable, link) {
        this.collapsable = collapsable;
        if (link.tagName.toLowerCase() !== 'a') {
            throw new Error(`Collapsable: External link has to be HTMLAnchorElement.'`);
        }
        const hash = link.getAttribute('href')?.substring(1);
        const collapsableItem = this.collapsable.getItemById(hash);
        if (!collapsableItem) {
            throw new Error(`Collapsable: External link has no associated collapsable item.'`);
        }
        this.extLink = link;
        this.collapsableItem = collapsableItem;
        this.addHandler();
    }
    addHandler() {
        const { options } = this.collapsable;
        this.listener = (event) => {
            if (options.externalLinks.preventDefault) {
                event.preventDefault();
            }
            if (this.collapsableItem.isExpanded) {
                this.collapsableItem.collapse(event, null, false);
            }
            else {
                this.collapsableItem.expand(event, null, false);
            }
        };
        this.extLink.addEventListener('click', this.listener);
    }
    toggleClass() {
        const { options } = this.collapsable;
        this.extLink.classList.toggle(options.classNames.externalLinkActive, this.collapsableItem.isExpanded);
    }
    destroy() {
        if (this.listener) {
            this.extLink.removeEventListener('click', this.listener);
        }
    }
}

class Collapsable {
    constructor(elements, options) {
        this.items = [];
        this.extLinks = [];
        this.defaultExpandedItem = [];
        this.defaults = {
            control: '.js-collapsable__control',
            box: '.js-collapsable__box',
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
                // CSS selector for external links. Has to be HTMLAnchorElement, click event is binded.
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
        };
        this.options = mergeDeep({}, this.defaults, options);
        this.promiseOpen = false;
        elements.forEach((element) => {
            const item = new CollapsableItem(this, element);
            if (item) {
                this.items.push(item);
            }
        });
        this.handleExternalLinks();
        this.prepareDefaultExpanded();
        this.handleDefaultExpanded();
    }
    handleExternalLinks() {
        const { options } = this;
        if (!options.externalLinks.selector) {
            return;
        }
        const extLinks = document.querySelectorAll(options.externalLinks.selector);
        extLinks.forEach((element) => {
            const extLink = new CollapsableExtLink(this, element);
            if (extLink) {
                this.extLinks.push(extLink);
            }
        });
    }
    prepareDefaultExpanded() {
        const { options } = this;
        const hash = window.location.hash.substring(1);
        const defaultExpanded = this.items.filter((item) => item.isDefaultExpanded);
        const defaultExpandedFromUrl = hash ? this.items.find((item) => item.id === hash) : undefined;
        if (defaultExpandedFromUrl) {
            this.defaultExpandedItem.push(defaultExpandedFromUrl);
        }
        if (defaultExpanded.length) {
            this.defaultExpandedItem.push(...defaultExpanded);
        }
        if (options.accordion) {
            this.defaultExpandedItem = this.defaultExpandedItem.slice(0, 1);
        }
        // If no default expanded is provided and options.collapsableAll === false, we choose first item
        if (this.defaultExpandedItem.length === 0 && !options.collapsableAll) {
            this.defaultExpandedItem.push(this.items[0]);
        }
    }
    handleDefaultExpanded() {
        const { options } = this;
        const collapsableEvent = new CustomEvent('init.collapsable', { bubbles: true });
        const force = !options.collapsableAll;
        this.defaultExpandedItem.forEach((item) => {
            item.expand(collapsableEvent, null, force);
        });
        this.items
            .filter((item) => !this.defaultExpandedItem.includes(item))
            .forEach((item) => {
            item.collapse(collapsableEvent, null, true);
        });
    }
    getExtLinkById(id) {
        return this.extLinks.filter((item) => item.collapsableItem.id === id);
    }
    getItemById(id) {
        return this.items.find((item) => item.id === id);
    }
    getExpanded() {
        return this.items.filter((item) => item.isExpanded);
    }
    expandAll(data) {
        const { options } = this;
        // If accordion, we only want to expand one (first) box, or none if already expanded
        if (options.accordion && this.getExpanded().length) {
            return;
        }
        const collapsableEvent = new CustomEvent('expandAll.collapsable');
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (item.isExpanded) {
                continue;
            }
            const hasExpanded = item.expand(collapsableEvent, data, false);
            if (options.accordion && hasExpanded) {
                break;
            }
        }
    }
    collapseAll(data) {
        const collapsableEvent = new CustomEvent('collapseAll.collapsable');
        this.getExpanded().forEach((item) => {
            item.collapse(collapsableEvent, data, false);
        });
    }
    destroy() {
        this.items.forEach((item) => item.destroy());
        this.extLinks.forEach((link) => link.destroy());
    }
}

export { Collapsable as default };
//# sourceMappingURL=index.esm.js.map
