import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/DriverFactoryBase';
import Drivers from '../../app/Drivers';
import Poling from '../../helpers/Poling';


interface GpioInputDriverParams {

}


export class GpioInputRaspberryDriver {
  private readonly drivers: Drivers;
  private readonly driverParams: GpioInputDriverParams;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(drivers: Drivers, driverParams: GpioInputDriverParams) {
    this.drivers = drivers;
    this.driverParams = driverParams;
  }

}


export default class GpioInputFactory extends DriverFactoryBase {
  private instances: {[index: string]: GpioInputRaspberryDriver} = {};

  getInstance(): GpioInputRaspberryDriver {
    this.instances[bus] = super.getInstance(bus) as GpioInputRaspberryDriver;

    return this.instances[bus];
  }
}
