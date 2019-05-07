import DriverBase from '../../../system/baseDrivers/DriverBase';
import DuplexDriver from '../../../system/interfaces/DuplexDriver';
import DriverFactoryBase from '../../../system/baseDrivers/DriverFactoryBase';
import {GetDriverDep} from '../../../system/entities/EntityBase';
import {omit} from '../../../system/helpers/lodashLike';


export type ReceiveHandler = (port: number, data: Uint8Array) => void;


export interface ChannelsProps {
  // duplex driver name
  driver: string;
  // driver props
  [index: string]: any;
}


export class Channels extends DriverBase<ChannelsProps> {
  private get driver(): DuplexDriver {
    return this.depsInstances.driver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.driver = await getDriverDep(this.props.driver)
      .getInstance(omit(this.props, 'drvier'));
  }


  /**
   * Send data to the other side
   * @param channel - one byte e.g 0x4f up to 0xff
   * @param data - data to send. It can be an empty Uint8Array
   */
  send(port: number, data: Uint8Array): Promise<void> {
    // TODO: convert number 0-256 to hex byte
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

export default class Factory extends DriverFactoryBase<Channels> {
  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return `${props.bus || 'default'}-${props.address}`;
  // }
  protected DriverClass = Channels;

  // TODO: инстансы по типу соединения (имени драйвера)
}
