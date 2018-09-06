import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/DriverFactoryBase';
import DriverEnv from '../../app/DriverEnv';
import Poling from '../../helpers/Poling';
import {EntityProps} from '../../app/interfaces/EntityDefinition';
//import DriverProps from '../../app/interfaces/DriverProps';


interface GpioInputDriverProps extends EntityProps {

}


export class GpioInputRaspberryDriver {
  private readonly props: GpioInputDriverProps;
  private readonly env: DriverEnv;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(props: GpioInputDriverProps, env: DriverEnv) {
    this.props = props;
    this.env = env;
  }

}


export default class GpioInputFactory extends DriverFactoryBase {
  private instances: {[index: string]: GpioInputRaspberryDriver} = {};

  getInstance(): GpioInputRaspberryDriver {
    this.instances[bus] = super.getInstance(bus) as GpioInputRaspberryDriver;

    return this.instances[bus];
  }
}
