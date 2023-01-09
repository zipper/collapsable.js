export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
export declare function mergeDeep(target: any, ...sources: any): Record<string, unknown>;
export declare let caUid: number;
export declare function getUid(): string;
