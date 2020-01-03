import DriverBase from 'system/base/DriverBase';
import NetworkDriver, {ReceiveHandler} from 'system/interfaces/NetworkDriver';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from 'system/lib/base/MasterSlaveBaseNodeDriver';


export interface I2cDuplexProps extends MasterSlaveBaseProps {
  // I2C address. Number for direction to slave. Undefined for direction to master
  address: number | undefined;

  // TODO: таймаут соединения

}


export class I2cDuplex extends DriverBase<I2cDuplexProps> implements NetworkDriver {
  private get i2cDriver(): MasterSlaveBaseNodeDriver<I2cDuplexProps> {
    return this.depsInstances.i2cDriver;
  }

  init = async () => {
    if (this.isToSlave()) {
      this.depsInstances.i2cDriver = await this.context.getSubDriver('I2cToSlave', this.props);
    }
    else {
      this.depsInstances.i2cDriver = await this.context.getSubDriver('I2cToMaster', this.props);
    }
    // listen to poll errors and print it to logger
    this.i2cDriver.addPollErrorListener((dataAddressStr: string | number | undefined, err: Error) => {
      this.log.error(String(err));
    });
  }

  // TODO: add start feedback

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

  onReceive(cb: ReceiveHandler): number {
    return this.i2cDriver.addListener(cb);
  }

  removeListener(handlerIndex: number): void {
    this.i2cDriver.removeListener(handlerIndex);
  }

  /**
   * If true that I'm master and direction of connection is to slave.
   */
  private isToSlave(): boolean {
    return typeof this.props.address !== 'undefined';
  }

}


export default class Factory extends DriverFactoryBase<I2cDuplex, I2cDuplexProps> {
  protected SubDriverClass = I2cDuplex;
  protected instanceId = (props: I2cDuplexProps): string => {
    return `${props.busNum || 'default'}-${props.address}`;
  }
}
