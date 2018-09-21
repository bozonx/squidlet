import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import {DriverBaseProps} from '../../app/entities/DriverBase';
import DriverBase from '../../app/entities/DriverBase';


type Handler = (level: BinaryLevel) => void;

interface DigitalOutputDriverProps extends DriverBaseProps {
  // TODO: !!!!
}


export class DigitalOutputDriver extends DriverBase<DigitalOutputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();

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

}

// TODO: validate params
// TODO: validate specific for certain driver params
// TODO: make uniq string for driver - raspberry-1-5a


export default class Factory extends DriverFactoryBase<I2cConnectionDriver, DigitalOutputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = I2cConnectionDriver;
}
