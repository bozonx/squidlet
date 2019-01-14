export type ReceiveHandler = (dataAddressStr: number | string, data: Uint8Array) => void;


export default interface DuplexDriver {
  send(dataAddressStr: number | string, data: Uint8Array): Promise<void>;
  request(dataAddressStr: number | string, data?: Uint8Array): Promise<Uint8Array>;

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(handler: ReceiveHandler): number;
  removeListener(handlerIndex: number): void;
}
