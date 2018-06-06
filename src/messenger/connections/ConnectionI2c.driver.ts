import * as EventEmitter from 'events';

import Drivers from "../../app/Drivers";
import ConnectionParams from "../interfaces/ConnectionParams";
import { uint8ArrayToString, stringToUint8Array } from '../../helpers/helpers';


/**
 * It packs data to send it via i2c.
 */
class DriverInstance {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connectionParams: ConnectionParams;
  private readonly eventName: string = 'data';

  constructor(drivers: Drivers, driverConfig: {[index: string]: any}, connectionParams: ConnectionParams) {
    this.drivers = drivers;
    this.connectionParams = connectionParams;
  }

  async send(address: string, payload: any): Promise<void> {
    const jsonString = JSON.stringify(payload);
    const uint8Arr = stringToUint8Array(jsonString);

    //await this.i2cDataDriver.write(this.connectionParams.bus, address, uint8Arr);
  }

  listenIncome(address: string, handler: (payload: any) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  off(handler: (payload: any) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  private handleIncomeData = (uint8Arr: Uint8Array): void => {
    const jsonString = uint8ArrayToString(uint8Arr);
    const data = JSON.parse(jsonString);

    this.events.emit(this.eventName, data);
  }

}


export default class ConnectionI2cDriver {
  private readonly drivers: Drivers;
  private readonly driverConfig: {[index: string]: any};

  constructor(drivers: Drivers, driverConfig: {[index: string]: any} = {}) {
    this.drivers = drivers;
    this.driverConfig = driverConfig;
  }

  getInstance(connectionParams: { type: string, bus: string }) {
    return new DriverInstance(this.drivers, this.driverConfig, connectionParams);
  }

};
