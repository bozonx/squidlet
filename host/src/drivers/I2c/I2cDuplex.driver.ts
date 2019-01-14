import DriverBase from '../../app/entities/DriverBase';
import DuplexDriver from '../../app/interfaces/DuplexDriver';
import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import MasterSlaveBaseNodeDriver, {Handler, MasterSlaveBaseProps} from '../../baseDrivers/MasterSlaveBaseNodeDriver';


export interface I2cDuplexDriverProps extends MasterSlaveBaseProps {
  // I2C address. Number for direction to slave. Undefined for direction to master
  address: number | undefined;

  // TODO: таймаут соединения

}


export class I2cDuplexDriver extends DriverBase<I2cDuplexDriverProps> implements DuplexDriver {
  private get i2cDriver(): MasterSlaveBaseNodeDriver<I2cDuplexDriverProps> {
    return this.depsInstances.i2cDriver as MasterSlaveBaseNodeDriver<I2cDuplexDriverProps>;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    if (this.isToSlave()) {
      this.depsInstances.i2cDriver = await getDriverDep('I2cToSlave.driver')
        .getInstance(this.props);
    }
    else {
      this.depsInstances.i2cDriver = await getDriverDep('I2cToMaster.driver')
        .getInstance(this.props);
    }
  }

  protected didInit = async () => {
    // listen to poll errors and print it to logger
    this.i2cDriver.addPollErrorListener((dataAddressStr: string | number, err: Error) => {
      this.env.system.log.error(String(err));
    });
  }


  send(dataAddressStr: number | string, data?: Uint8Array): Promise<void> {

    // TODO: таймаут соединения

    if (typeof dataAddressStr === 'undefined') {
      throw new Error(`I2cDuplexDriver.send: You have to specify a "dataAddress" param`);
    }

    return this.i2cDriver.write(dataAddressStr, data);
  }

  request(dataAddressStr: number | string, data?: Uint8Array): Promise<Uint8Array> {

    // TODO: таймаут соединения ??? или он есть в sender ???

    if (typeof dataAddressStr === 'undefined') {
      throw new Error(`I2cDuplexDriver.request: You have to specify a "dataAddress" param`);
    }

    return this.i2cDriver.request(dataAddressStr, data);
  }

  onReceive(cb: Handler): number {
    return this.i2cDriver.addListener(cb);
  }

  removeListener(handlerIndex: number): void {
    this.i2cDriver.removeListener(handlerIndex);
  }

  /**
   * If true that I'm master and direction of connection is to slave.
   */
  private isToSlave(): boolean {
    return typeof this.props.address === 'undefined';
  }

}


export default class Factory extends DriverFactoryBase<I2cDuplexDriver> {
  protected DriverClass = I2cDuplexDriver;

  // TODO: почему всегда новый инстанс, а не по address + bus ???

  protected instanceAlwaysNew = true;
}
