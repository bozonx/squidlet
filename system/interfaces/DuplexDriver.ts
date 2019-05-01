export type ReceiveHandler = (action: number, data: Uint8Array) => void;


export default interface DuplexDriver {
  /**
   * Send data to the other side
   * @param action - one byte e.g 0x4f up to 0xff
   * @param data - data to send. It can be an empty Uint8Array
   */
  send(action: number, data: Uint8Array): Promise<void>;

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side
   */
  request(action: number, data: Uint8Array): Promise<Uint8Array>;

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(action: number, handler: ReceiveHandler): number;
  //onReceiveAll(handler: ReceiveHandler): number;
  removeListener(handlerIndex: number): void;
}
