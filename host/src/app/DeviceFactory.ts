import * as path from 'path';

import System from './System';
import DeviceInstance from './interfaces/DeviceInstance';
import DeviceDefinition from './interfaces/DeviceDefinition';


type DeviceType = { new (system: System, deviceConf: DeviceDefinition): DeviceInstance };


export default class DeviceFactory {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  async create(deviceConf: DeviceDefinition): Promise<DeviceInstance> {
    // make instance of device
    const devicePath: string = path.resolve(deviceConf.manifest.baseDir, deviceConf.manifest.main);
    const DeviceClass: DeviceType = this.require(devicePath);
    const device: DeviceInstance = new DeviceClass(this.system, deviceConf);

    this._validateSchema(deviceConf);

    // TODO: add subscribers from schema

    // run own device validate method
    this._validateDevice(device, deviceConf);

    // initialize a device
    await device.init();

    return device;
  }

  /**
   * Run additional device validation if it defined in device class.
   * It calls a "validate" method of device if it is defined.
   * @param {object} device - instance of device
   * @param {object} deviceConf - config of device
   * @private
   */
  _validateDevice(device: DeviceInstance, deviceConf: DeviceDefinition) {
    // own device validate method is optional
    if (!device.validate) return;

    // do validate of device config
    const invalidMsg = device.validate(deviceConf);

    if (typeof invalidMsg === 'string') {
      this.system.log.fatal(`Invalid config for device "${deviceConf.deviceId}: ${invalidMsg}. Config: ${JSON.stringify(deviceConf)}"`);
    }
  }

  _validateSchema(deviceConf: DeviceDefinition) {

    // TODO: test


    return;

    // TODO: check connection


  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
