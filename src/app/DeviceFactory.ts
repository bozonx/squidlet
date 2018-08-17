import * as path from 'path';

import System from './System';
import Device from './interfaces/Device';
import DeviceConf from './interfaces/DeviceConf';


type DeviceType = { new (system: System, deviceConf: DeviceConf): Device };


export default class DeviceFactory {
  private readonly system: System;

  constructor(system: System) {
    this.system = system;
  }

  async create(deviceConf: DeviceConf): Promise<Device> {
    // make instance of device
    const devicePath: string = path.resolve(deviceConf.manifest.baseDir, deviceConf.manifest.main);
    const DeviceClass: DeviceType = this.require(devicePath);
    const device: Device = new DeviceClass(this.system, deviceConf);

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
  _validateDevice(device: Device, deviceConf: DeviceConf) {
    // own device validate method is optional
    if (!device.validate) return;

    // do validate of device config
    const invalidMsg = device.validate(deviceConf);

    if (typeof invalidMsg === 'string') {
      this.system.log.fatal(`Invalid config for device "${deviceConf.deviceId}: ${invalidMsg}. Config: ${JSON.stringify(deviceConf)}"`);
    }
  }

  _validateSchema(deviceConf: DeviceConf) {

    // TODO: test


    return;

    // TODO: check connection

    // const recursive = (container, curPath) => {
    //   _.each(container, (item, name) => {
    //     const itemPath = _.trimStart(`${curPath}.${name}`, '.');
    //
    //     if (_.isString(item)) {
    //       // TODO: validate type
    //     }
    //     else if (_.isPlainObject(item) && item.type) {
    //       // TODO: validate type
    //     }
    //     else if (_.isPlainObject(item)) {
    //       recursive(item, itemPath);
    //     }
    //     else {
    //       throw new Error(`Can't parse schema of device ${deviceName}`);
    //     }
    //   });
    //
    // };
    //
    // recursive(schema.params, '');
  }

  // it needs for test purpose
  private require(devicePath: string) {
    return require(devicePath);
  }

}
