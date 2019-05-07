import {I2cDuplex} from '../I2cDuplex/I2cDuplex';
import DriverBase from '../../../system/baseDrivers/DriverBase';
import DuplexDriver from '../../../system/interfaces/DuplexDriver';
import DriverFactoryBase from '../../../system/baseDrivers/DriverFactoryBase';


export type ReceiveHandler = (channel: number, data: Uint8Array) => void;


export interface ChannelsProps {

}


export class Channels extends DriverBase<ChannelsProps> {


  /**
   * Send data to the other side
   * @param action - one byte e.g 0x4f up to 0xff
   * @param data - data to send. It can be an empty Uint8Array
   */
  send(channel: number, data: Uint8Array): Promise<void> {
    // TODO: convert number 0-256 to hex byte
  }

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side
   */
  request(channel: number, data: Uint8Array): Promise<Uint8Array> {

  }

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(channel: number, handler: ReceiveHandler): number {

  }

  removeListener(channel: number, handlerIndex: number): void {

  }
}

export default class Factory extends DriverFactoryBase<Channels> {
  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return `${props.bus || 'default'}-${props.address}`;
  // }
  protected DriverClass = Channels;
}
