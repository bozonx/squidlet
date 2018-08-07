import * as _ from 'lodash';
import * as EventEmitter from 'events';

import DriverFactoryBase from '../app/DriverFactoryBase';
import Drivers from '../app/Drivers';
import {BinaryLevel} from '../app/CommonTypes';


type Handler = (level: BinaryLevel) => void;

interface GpioInputDriverParams {
  // TODO: !!!!
}


export class GpioInputDriver {
  private readonly drivers: Drivers;
  private readonly driverParams: GpioInputDriverParams;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(drivers: Drivers, driverParams: GpioInputDriverParams) {
    this.drivers = drivers;
    this.driverParams = driverParams;
  }

  async getLevel(): Promise<BinaryLevel> {
    // TODO: add
    // TODO: трансформировать левел

    return 1;
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
      driverParams: {[index: string]: any},
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
