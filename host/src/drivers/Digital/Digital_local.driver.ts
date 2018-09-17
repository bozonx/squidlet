import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/entities/DriverFactoryBase';
import DriverEnv from '../../app/entities/DriverEnv';
import {EntityProps} from '../../app/interfaces/EntityDefinition';


interface GpioInputDriverProps extends EntityProps {

}


export class DigitalLocalDriver {
  private readonly props: GpioInputDriverProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: GpioInputDriverProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

}


export default class GpioInputFactory extends DriverFactoryBase<DigitalLocalDriver> {
  protected instanceIdName: string | number = 'pin';
  protected DriverClass = DigitalLocalDriver;

  getInstance(additionalProps: { pin: number }): DigitalLocalDriver {
    return super.getInstance(additionalProps);
  }
}
