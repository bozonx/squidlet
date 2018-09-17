import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverEnv from '../../app/entities/DriverEnv';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


interface GpioInputDriverProps extends EntityProps {

}


export class DigitalPcf8574Driver {
  private readonly props: GpioInputDriverProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: GpioInputDriverProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalPcf8574Driver> {
  protected instanceIdName: string | number = 'pin';
  protected DriverClass = DigitalPcf8574Driver;

  // getInstance(additionalProps: { pin: number }): DigitalInputPcf8574Driver {
  //   return super.getInstance(additionalProps);
  // }
}
