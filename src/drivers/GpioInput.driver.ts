import * as _ from 'lodash';
import * as EventEmitter from 'events';

import DriverFactoryBase from '../app/DriverFactoryBase';
import Drivers from '../app/Drivers';
import {BinaryValue} from '../app/CommonTypes';


type Handler = (value: BinaryValue) => void;

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

  getLevel(): BinaryValue {

  }

  onChange(handler: Handler): void {

  }

  removeListener(handler: Handler): void {

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
