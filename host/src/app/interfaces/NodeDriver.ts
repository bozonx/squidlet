export type ReceiveHandler = (data: Uint8Array) => void;


export default interface NodeDriver {
  send(dataAddress: number | undefined, data: Uint8Array): Promise<void>;
  request(dataAddress?: number, data?: Uint8Array): Promise<Uint8Array>;
  onReceive(handler: ReceiveHandler): number;
  removeListener(handlerIndex: number): void;
  getLastData(): Uint8Array;
}
