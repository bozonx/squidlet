import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverEnv from '../../app/entities/DriverEnv';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


interface DigitalPcf8574DriverProps extends EntityProps {

}


export class DigitalPcf8574Driver {
  private readonly props: DigitalPcf8574DriverProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: DigitalPcf8574DriverProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalPcf8574Driver, DigitalPcf8574DriverProps> {
  protected instanceIdName: string = 'i2c';
  protected DriverClass = DigitalPcf8574Driver;
}
