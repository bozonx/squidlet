import DuplexDriver from 'system/interfaces/DuplexDriver';
import {addFirstItemUint8Arr} from '../../../system/helpers/collections';
import {ReceiveHandler} from './Channels';


export default class ChannelsLogic {
  private readonly duplexDriver: DuplexDriver;


  constructor(duplexDriver: DuplexDriver) {
    this.duplexDriver = duplexDriver;
  }



  /**
   * Send data to the other side
   * @param port - number from 0 to 255
   * @param data - data to send. It can be an empty Uint8Array
   */
  send(port: number, data: Uint8Array): Promise<void> {
    // TODO: convert number 0-256 to hex byte
    const message: Uint8Array = addFirstItemUint8Arr(data, action);
  }

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side
   */
  request(port: number, data: Uint8Array): Promise<Uint8Array> {

  }

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(port: number, handler: ReceiveHandler): number {

  }

  removeListener(port: number, handlerIndex: number): void {

  }

}
