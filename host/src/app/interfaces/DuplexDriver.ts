export type ReceiveHandler = (dataAddress: number, data: Uint8Array) => void;


export default interface DuplexDriver {
  send(dataAddress: number, data: Uint8Array): Promise<void>;
  request(dataAddress: number, data?: Uint8Array): Promise<Uint8Array>;

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(handler: ReceiveHandler): number;
  removeListener(handlerIndex: number): void;
}
