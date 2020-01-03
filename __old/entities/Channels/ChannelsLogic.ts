import DuplexDriver from 'interfaces/DuplexDriver';
import {addFirstItemUint8Arr} from 'lib/binaryHelpers';


export type ReceiveHandler = (channel: number, data: Uint8Array) => void;


export default class ChannelsLogic {
  private readonly duplexDriver: DuplexDriver;


  constructor(duplexDriver: DuplexDriver) {
    this.duplexDriver = duplexDriver;
  }



  /**
   * Send data to the other side
   * @param channel - number from 0 to 255
   * @param data - data to send. It can be an empty Uint8Array
   */
  send(channel: number, data: Uint8Array): Promise<void> {
    // TODO: convert number 0-256 to hex byte
    const message: Uint8Array = addFirstItemUint8Arr(data, action);
  }

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(channel: number, handler: ReceiveHandler): number {

  }

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side
   */
  request(channel: number, data: Uint8Array): Promise<Uint8Array> {

  }

  // TODO: add respond ??

  removeListener(channel: number, handlerIndex: number): void {

  }

  close(channel: number) {

  }

}
