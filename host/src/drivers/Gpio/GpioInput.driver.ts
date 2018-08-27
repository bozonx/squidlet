import * as EventEmitter from 'events';

import DriverFactoryBase from '../../app/DriverFactoryBase';
import Drivers from '../../app/Drivers';
import {BinaryLevel} from '../../app/CommonTypes';
import DriverProps from '../../app/interfaces/DriverProps';


type Handler = (level: BinaryLevel) => void;


export class GpioInputDriver {
  private readonly drivers: Drivers;
  private readonly driverProps: DriverProps;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(drivers: Drivers, driverProps: DriverProps) {
    this.drivers = drivers;
    this.driverProps = driverProps;
  }

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


export default class GpioInputFactory extends DriverFactoryBase {
  protected DriverClass: { new (
      drivers: Drivers,
      driverProps: DriverProps,
    ): GpioInputDriver } = GpioInputDriver;
  private instances: {[index: string]: GpioInputDriver} = {};

  getInstance(deviceParams: {[index: string]: any}): GpioInputDriver {

    // TODO: validate params
    // TODO: validate specific for certain driver params
    // TODO: make uniq string for driver - raspberry-1-5a

    const instanceId = '1';

    if (!this.instances[instanceId]) {
      this.instances[instanceId] = super.getInstance(instanceId) as GpioInputDriver;
    }

    return this.instances[instanceId];
  }

}
