import DriverBase from '../../app/entities/DriverBase';
import DuplexDriver, {ReceiveHandler} from '../../app/interfaces/DuplexDriver';
import {SerialDuplexDriver, SerialNodeProps} from '../Serial/SerialDuplex.driver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';

export class I2cToSlaveDuplexDriver extends DriverBase<SerialNodeProps> implements DuplexDriver {
  async send(dataAddress: number, data?: Uint8Array): Promise<void> {

  }

  async request(dataAddress: number, data?: Uint8Array): Promise<Uint8Array> {

  }

  onReceive(cb: ReceiveHandler): number {

  }

  removeListener(handlerIndex: number): void {

  }

}


export default class Factory extends DriverFactoryBase<SerialDuplexDriver> {
  protected DriverClass = SerialDuplexDriver;

  // TODO: почему всегда новый инстанс, а не по address + bus ???

  protected instanceAlwaysNew = true;
}
