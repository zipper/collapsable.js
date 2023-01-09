import { Collapsable, CollapsableEvent } from './Collapsable';
export interface HTMLCollapsableItem extends HTMLElement {
    collapsableItem?: CollapsableItem;
}
export declare class CollapsableItem {
    private readonly collapsable;
    private readonly item;
    private className;
    isExpanded: boolean;
    readonly id: string;
    readonly controlElements: HTMLElement[];
    readonly controlLinkElements: HTMLElement[];
    readonly boxElements: HTMLElement[];
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
    isDefaultExpanded(): boolean;
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
