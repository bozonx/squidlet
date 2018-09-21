import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import {BinaryLevel} from '../../app/CommonTypes';
import {I2cConnectionDriver} from '../../network/connections/I2c.connection.driver';
import {DriverBaseProps} from '../../app/entities/DriverBase';
import DriverBase from '../../app/entities/DriverBase';


type Handler = (level: BinaryLevel) => void;

interface DigitalInputDriverProps extends DriverBaseProps {
  // TODO: !!!!
}


// TODO: add watchOnce
// TODO: инициализировать output значение - 1 или 0

export class DigitalInputDriver extends DriverBase<DigitalInputDriverProps> {
  private readonly events: EventEmitter = new EventEmitter();

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

}


export default class Factory extends DriverFactoryBase<I2cConnectionDriver, DigitalInputDriverProps> {
  protected instanceIdName: string = 'pin';
  protected DriverClass = I2cConnectionDriver;
}
