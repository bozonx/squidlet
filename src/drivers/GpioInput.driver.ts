import * as _ from 'lodash';
import * as EventEmitter from 'events';

import DriverFactoryBase from '../app/DriverFactoryBase';
import Drivers from '../app/Drivers';
import Poling from '../helpers/Poling';


interface GpioInputDriverParams {

}


export class GpioInputDriver {
  private readonly drivers: Drivers;
  private readonly driverParams: GpioInputDriverParams;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(drivers: Drivers, driverParams: GpioInputDriverParams) {
    this.drivers = drivers;
    this.driverParams = driverParams;
  }

}


export default class GpioInputFactory extends DriverFactoryBase {
  private instances: {[index: string]: GpioInputDriver} = {};

  getInstance(): GpioInputDriver {
    this.instances[bus] = super.getInstance(bus) as GpioInputDriver;

    return this.instances[bus];
  }
}
