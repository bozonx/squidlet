import DriverBase from '../../../../__idea2021/src/base/DriverBase';
import DuplexDriver from '../../../system/interfaces/DuplexDriver';
import DriverFactoryBase from '../../../../__idea2021/src/base/DriverFactoryBase';
import {omitObj} from '../../../../../squidlet-lib/src/objects';
import {addFirstItemUint8Arr} from '../../../../../squidlet-lib/src/binaryHelpers';


export interface ChannelsProps {
  // duplex driver name
  duplex: string;
  // duplex driver's props
  [index: string]: any;
}


export class Channels extends DriverBase<ChannelsProps> {
  private get driver(): DuplexDriver {
    return this.depsInstances.driver;
  }


  init = async () => {
    this.depsInstances.driver = await this.context.getSubDriver(this.props.driver, omit(this.props, 'drvier'));
  }


  /**
   * Send data to the other side
   * @param port - number from 0 to 255
   * @param data - data to send. It can be an empty Uint8Array
   */
  send(channel: number, data: Uint8Array): Promise<void> {
    // TODO: convert number 0-256 to hex byte
    const message: Uint8Array = addFirstItemUint8Arr(data, action);
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
  // protected instanceId = (props: {[index: string]: any}): string => {
  //   return `${props.bus || 'default'}-${props.address}`;
  // }
  protected SubDriverClass = Channels;

  // TODO: инстансы по типу соединения (имени драйвера)
}
