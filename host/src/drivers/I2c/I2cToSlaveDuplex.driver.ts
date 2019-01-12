import DriverBase from '../../app/entities/DriverBase';
import DuplexDriver, {ReceiveHandler} from '../../app/interfaces/DuplexDriver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {I2cToSlaveDriver, I2cToSlaveDriverProps} from './I2cToSlave.driver';
import {GetDriverDep} from '../../app/entities/EntityBase';


export interface I2cToSlaveDuplexDriverProps extends I2cToSlaveDriverProps {
}


export class I2cToSlaveDuplexDriver extends DriverBase<I2cToSlaveDuplexDriverProps> implements DuplexDriver {

  // TODO: может определять что мастер по наличию адреса?
  // TODO: setup poll on several data address

  private get i2cNode(): I2cToSlaveDriver {
    return this.depsInstances.i2cNode as I2cToSlaveDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.i2cNode = await getDriverDep('I2cToSlave.driver')
      .getInstance(this.props);
  }


  send(dataAddress: number, data?: Uint8Array): Promise<void> {
    return this.i2cNode.write(dataAddress, data);
  }

  request(dataAddress: number, data?: Uint8Array): Promise<Uint8Array> {
    return this.i2cNode.request(dataAddress, data);
  }

  onReceive(cb: ReceiveHandler): number {
    // TODO: add listeners of settedup data addresses
  }

  removeListener(handlerIndex: number): void {
    // TODO: make it
  }

}


export default class Factory extends DriverFactoryBase<I2cToSlaveDuplexDriver> {
  protected DriverClass = I2cToSlaveDuplexDriver;

  // TODO: почему всегда новый инстанс, а не по address + bus ???

  protected instanceAlwaysNew = true;
}
