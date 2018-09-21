import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import {DriverBaseProps} from '../../app/entities/DriverBase';
import DriverBase from '../../app/entities/DriverBase';
import GpioDigitalDriver from '../../app/interfaces/GpioDigitalDriver';
import {GetDriverDep} from '../../app/entities/EntityBase';


type Handler = (level: BinaryLevel) => void;

interface DigitalInputDriverProps extends DriverBaseProps {
  // if no one of pullup and pulldown are set then both resistors will off
  // use pullup resistor
  pullup?: boolean;
  // use pulldown resistor
  pulldown?: boolean;
  // when receives 1 actually returned 0 and otherwise
  invert: boolean;
  // by default is local driver used
  driver?: {
    name: string;
    // Physical driver's params
    [index: string]: any;
  };

  // TODO: add base - pin, statusRepublishInterval, configRepublishInterval
  // TODO: ??? valueLogLevel
}


// TODO: add watchOnce
// TODO: инициализировать output значение - 1 или 0

export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();

  private get digital(): GpioDigitalDriver {
    return this.depsInstances.digital as GpioDigitalDriver;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    // TODO: get driver name
    this.depsInstances.digital = getDriverDep('I2cSlave.dev')
      .getInstance(this.props);
  }

  // TODO: если используется pullup нужно ли делать negative|invert ????


  async getLevel(): Promise<BinaryLevel> {
    // TODO: add
    // TODO: трансформировать левел

    return true;
  }

  onChange(handler: Handler): void {
    // TODO: add
    // TODO: трансформировать левел
  }

  removeListener(handler: Handler): void {
    // TODO: add
  }

  validateProps = (): string | undefined => {
    // TODO: validate params
    // TODO: validate specific for certain driver params
    return;
  }

}


export default class Factory extends DriverFactoryBase<I2cConnectionDriver, DigitalInputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = I2cConnectionDriver;
}
