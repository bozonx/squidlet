import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/DriverFactoryBase';
import DriverEnv from '../../app/DriverEnv';
import Poling from '../../helpers/Poling';
//import DriverProps from '../../app/interfaces/DriverProps';


interface GpioInputDriverProps extends DriverProps {

}


export class GpioInputRaspberryDriver {
  private readonly driverEnv: DriverEnv;
  private readonly driverProps: GpioInputDriverProps;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(driverEnv: DriverEnv, driverProps: GpioInputDriverProps) {
    this.driverEnv = driverEnv;
    this.driverProps = driverProps;
  }

}


export default class GpioInputFactory extends DriverFactoryBase {
  private instances: {[index: string]: GpioInputRaspberryDriver} = {};

  getInstance(): GpioInputRaspberryDriver {
    this.instances[bus] = super.getInstance(bus) as GpioInputRaspberryDriver;

    return this.instances[bus];
  }
}
