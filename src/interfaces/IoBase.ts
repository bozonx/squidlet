export interface IoBase {
  init?(): Promise<void>
  destroy?(): Promise<void>
  on(eventName: number, cb: (...params: any[]) => void): Promise<number>
  off(handlerIndex: number): Promise<void>
}
