import * as EventEmitter from 'events';

import System from '../app/System';
import Republish from './Republish';
import {Publisher} from './DeviceBase';
import {validateParam} from '../helpers/validateSchema';


export type Schema = {[index: string]: any};

export const changeEventName = 'change';


/**
 * Manage status of device
 */
export default abstract class DeviceDataManagerBase {
  protected readonly deviceId: string;
  protected readonly system: System;
  protected readonly events: EventEmitter = new EventEmitter();
  protected readonly publish: Publisher;
  protected readonly schema: Schema;
  protected readonly republish: Republish;

  protected constructor(
    deviceId: string,
    system: System,
    schema: Schema,
    publish: Publisher,
    republishInterval?: number,
  ) {
    this.deviceId = deviceId;
    this.system = system;
    this.schema = schema;
    this.publish = publish;

    const realRepublishInterval = (typeof republishInterval === 'undefined')
      ? this.system.host.config.devices.defaultStatusRepublishIntervalMs
      : republishInterval;

    this.republish = new Republish(realRepublishInterval);
  }

  abstract async init(): Promise<void>;

  onChange(cb: (...params: any[]) => void) {
    this.events.addListener(changeEventName, cb);
  }

  removeListener(cb: (...params: any[]) => void) {
    this.events.removeListener(changeEventName, cb);
  }

  protected validateStatus(statusName: string, value: any, errorMsg: string) {
    const validateError: string | undefined = validateParam(this.schema, statusName, value);

    if (validateError) {
      const completeErrMsg = `${errorMsg}: ${validateError}`;

      this.system.log.error(completeErrMsg);
      throw new Error(completeErrMsg);
    }
  }

  protected async fetch(fetcher: () => void, errorMsg: string): Promise<any> {
    let result;

    try {
      result = await fetcher();
    }
    catch(err) {
      this.system.log.error(`${errorMsg}: ${err.toString()}`);
      throw new Error(err);
    }

    return result;
  }

}
