import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/DriverFactoryBase';
import Drivers from '../../app/Drivers';
import Poling from '../../helpers/Poling';
import DriverProps from '../../app/interfaces/DriverProps';


interface GpioInputDriverProps extends DriverProps {

}


export class GpioInputRaspberryDriver {
  private readonly drivers: Drivers;
  private readonly driverProps: GpioInputDriverProps;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(drivers: Drivers, driverProps: GpioInputDriverProps) {
    this.drivers = drivers;
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
