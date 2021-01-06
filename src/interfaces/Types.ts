export type PropTypes = 'string' | 'number' | 'boolean' | 'object' | 'array'
export type InitialLevel = 1 | 0 | 'low' | 'high'
// Try to not to use null because it is a bad way.
export type Primitives = string | number | boolean | null
export type JsonTypes = Primitives | Primitives[] | {[index: string]: Primitives}
export type Dictionary = {[index: string]: JsonTypes | undefined}
