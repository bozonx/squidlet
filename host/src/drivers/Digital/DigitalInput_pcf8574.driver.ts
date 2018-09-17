import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverEnv from '../../app/entities/DriverEnv';
import Poling from '../../helpers/Poling';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


interface GpioInputDriverProps extends EntityProps {

}


export class DigitalInputPcf8574Driver {
  private readonly props: GpioInputDriverProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: GpioInputDriverProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalInputPcf8574Driver> {
  protected instanceIdName: string | number = 'pin';
  protected DriverClass = DigitalInputPcf8574Driver;

  // getInstance(additionalProps: { pin: number }): DigitalInputPcf8574Driver {
  //   return super.getInstance(additionalProps);
  // }
}
