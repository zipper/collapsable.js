import { Collapsable, CollapsableEvent } from './Collapsable';
export interface HTMLCollapsableItem extends HTMLElement {
    collapsableItem?: CollapsableItem;
}
export declare class CollapsableItem {
    readonly collapsable: Collapsable;
    readonly id: string;
    readonly element: HTMLCollapsableItem;
    readonly controlElements: HTMLElement[];
    readonly controlInteractiveElements: HTMLElement[];
    readonly boxElements: HTMLElement[];
    private _isExpanded;
    private listenersMap;
    constructor(collapsable: Collapsable, element: HTMLElement);
    private prepareDOM;
    private addHandlers;
    /**
     * Handling common parts of expanding and collapsing
     */
    private handleExpandCollapse;
    expand(collapsableEvent: any, data: any, force: boolean): boolean;
    collapse(collapsableEvent: any, data: any, force: boolean): boolean;
    get isDefaultExpanded(): boolean;
    get isExpanded(): boolean;
    destroy(): void;
}
declare global {
    interface HTMLElementEventMap {
        'expand.collapsable': CollapsableEvent;
        'expanded.collapsable': CollapsableEvent;
        'collapse.collapsable': CollapsableEvent;
        'collapsed.collapsable': CollapsableEvent;
        'destroy.collapsable': CustomEvent;
    }
}
