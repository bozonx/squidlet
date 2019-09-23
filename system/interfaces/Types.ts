export type BlockMode = 'refuse' | 'defer';
export type InitialLevel = 1 | 0 | 'low' | 'high';
// using null is bad thing
// TODO: review что не ключает undefined и null
export type Primitives = string | number | boolean | undefined | null;
// TODO: review что не ключает undefined
export type JsonTypes = Primitives | any[] | {[index: string]: any};
export type Dictionary = {[index: string]: JsonTypes};
