export type BlockMode = 'refuse' | 'defer';
export type InitialLevel = 1 | 0 | 'low' | 'high';
// TODO: don't use null
export type Primitives = string | number | boolean | undefined | null;
export type JsonTypes = Primitives | any[] | {[index: string]: any};
export type Dictionary = {[index: string]: JsonTypes};
