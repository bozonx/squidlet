
// TODO: может ли быть data addr undefined ?
export type ReceiveHandler = (dataAddressStr: number | string | undefined, data: Uint8Array) => void;


export default interface DuplexDriver {
  send(dataAddressStr: number | string, data: Uint8Array): Promise<void>;

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side
   */
  request(dataAddressStr: number | string, data?: Uint8Array): Promise<Uint8Array>;

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(dataAddressStr: number | string, handler: ReceiveHandler): number;
  //onReceiveAll(handler: ReceiveHandler): number;
  removeListener(handlerIndex: number): void;
}
