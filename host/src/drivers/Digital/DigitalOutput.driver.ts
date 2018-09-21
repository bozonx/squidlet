import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import {DriverBaseProps} from '../../app/entities/DriverBase';
import DriverBase from '../../app/entities/DriverBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import GpioDigitalDriver from '../../app/interfaces/GpioDigitalDriver';


type Handler = (level: BinaryLevel) => void;

interface DigitalOutputDriverProps extends DriverBaseProps {
  initial?: 'low' | 'high';
  // when sends 1 actually sends 0 and otherwise
  invert?: boolean;
  // by default is local driver used
  driver?: {
    name: string;
    // Physical driver's params
    [index: string]: any;
  };

  // TODO: add base - pin, statusRepublishInterval, configRepublishInterval
  // TODO: ??? valueLogLevel
}


export class DigitalOutputDriver extends DriverBase<DigitalOutputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();

  private get digital(): GpioDigitalDriver {
    return this.depsInstances.digital as GpioDigitalDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    const driverName = ``;
    // TODO: get driver name
    this.depsInstances.digital = getDriverDep('I2cSlave.dev')
      .getInstance(this.props);
  }


  async getLevel(): Promise<BinaryLevel> {
    // TODO: add
    // TODO: трансформировать левел

    return true;
  }

  async setLevel(newLevel: BinaryLevel): Promise<void> {
    // TODO: add
    // TODO: трансформировать левел

  }

  onChange(handler: Handler): void {
    // TODO: add
    // TODO: трансформировать левел
  }

  removeListener(handler: Handler): void {
    // TODO: add
  }


  private calcInitial(): boolean {
    if (this.props.invert) {
      // if initial === 'high' it'll be logical 0 if undefines of low - 1
      return typeof this.props.initial === 'undefined' || this.props.initial === 'low';
    }
    else {
      // if initial === high it's logical 1, otherwise 0;
      return this.props.initial === 'high';
    }
  }

  validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate specific for certain driver params
    return;
  }

}



// TODO: make uniq string for driver - raspberry-1-5a


export default class Factory extends DriverFactoryBase<I2cConnectionDriver, DigitalOutputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = I2cConnectionDriver;
}
