import DriverBase from 'system/base/DriverBase';
import DuplexDriver, {ReceiveHandler} from 'system/interfaces/DuplexDriver';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import MasterSlaveBaseNodeDriver, {MasterSlaveBaseProps} from 'system/base/MasterSlaveBaseNodeDriver';


export interface I2cDuplexProps extends MasterSlaveBaseProps {
  // I2C address. Number for direction to slave. Undefined for direction to master
  address: number | undefined;

  // TODO: таймаут соединения

}


export class I2cDuplex extends DriverBase<I2cDuplexProps> implements DuplexDriver {
  private get i2cDriver(): MasterSlaveBaseNodeDriver<I2cDuplexProps> {
    return this.depsInstances.i2cDriver;
  }

  protected init = async () => {
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


export default class Factory extends DriverFactoryBase<I2cDuplex> {
  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.bus || 'default'}-${props.address}`;
  }
  protected DriverClass = I2cDuplex;
}
