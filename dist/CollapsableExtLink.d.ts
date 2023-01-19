import { CollapsableItem } from './CollapsableItem';
import { Collapsable } from './Collapsable';
export declare class CollapsableExtLink {
    private readonly collapsable;
    readonly extLink: HTMLElement;
    readonly collapsableItem: CollapsableItem;
    private listener;
    constructor(collapsable: Collapsable, link: HTMLAnchorElement);
    private addHandler;
    toggleClass(): void;
    destroy(): void;
}
