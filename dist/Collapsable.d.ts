import { CollapsableItem } from './CollapsableItem';
import { DeepPartial } from './utils';
import { CollapsableExtLink } from './CollapsableExtLink';
export type CollapsableOptions = {
    control: string;
    box: string;
    event: string;
    preventDefault: boolean;
    fxDuration: 0;
    accordion: boolean;
    collapsableAll: boolean;
    externalLinks: {
        selector: string;
        preventDefault: boolean;
    };
    classNames: {
        link: string;
        expanded: string;
        collapsed: string;
        defaultExpanded: string;
        externalLinkActive: string;
    };
};
export type CollapsableEvent = CustomEvent<{
    collapsableEvent: CustomEvent | Event;
    data?: any;
}>;
export declare class Collapsable {
    readonly options: CollapsableOptions;
    promiseOpen: boolean;
    readonly items: CollapsableItem[];
    private extLinks;
    private defaultExpandedItem;
    private readonly defaults;
    constructor(elements: NodeListOf<HTMLElement>, options?: DeepPartial<CollapsableOptions>);
    private handleExternalLinks;
    private prepareDefaultExpanded;
    private handleDefaultExpanded;
    getExtLinkById(id?: string): CollapsableExtLink[];
    getItemById(id?: string): CollapsableItem | undefined;
    getExpanded(): CollapsableItem[];
    expandAll(data?: any): void;
    collapseAll(data?: any): void;
    destroy(): void;
}
