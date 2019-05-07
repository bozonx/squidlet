import DriverBase from '../../../system/baseDrivers/DriverBase';
import DuplexDriver from '../../../system/interfaces/DuplexDriver';
import DriverFactoryBase from '../../../system/baseDrivers/DriverFactoryBase';
import {GetDriverDep} from '../../../system/entities/EntityBase';
import {omit} from '../../../system/helpers/lodashLike';
import {addFirstItemUint8Arr} from '../../../system/helpers/collections';


export type ReceiveHandler = (port: number, data: Uint8Array) => void;


export interface PortsProps {
  // duplex driver name
  duplex: string;
  // duplex driver's props
  [index: string]: any;
}


export class Channels extends DriverBase<PortsProps> {
  private get driver(): DuplexDriver {
    return this.depsInstances.driver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.driver = await getDriverDep(this.props.driver)
      .getInstance(omit(this.props, 'drvier'));
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

export default class Factory extends DriverFactoryBase<Channels> {
  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return `${props.bus || 'default'}-${props.address}`;
  // }
  protected DriverClass = Channels;

  // TODO: инстансы по типу соединения (имени драйвера)
}
