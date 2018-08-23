const _omit = require('lodash/omit');

import System from './System';
import Device from './interfaces/Device';
import DeviceFactory from './DeviceFactory';
import DeviceManifest from './interfaces/DeviceManifest';
import DeviceConf from './interfaces/DeviceConf';


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class DevicesManager {
  private readonly system: System;
  private readonly deviceFactory: DeviceFactory;
  // devices instances by ids
  private readonly instances: {[index: string]: Device} = {};

  constructor(system: System) {
    this.system = system;
    this.deviceFactory = new DeviceFactory(this.system);
  }

  /**
   * Initialize all the devices on current host specified by manifests
   * and using user defined config for devices.
   * @param {object} devicesManifests - parsed devices manifests.
   *                                   Structure like { DeviceName: { ...manifest } }
   * @param {object} devices - user defined definition of devices by ids { "room.device": { ...deviceConfig } }
   */
  init(
    devicesManifests: {[index: string]: DeviceManifest},
    devices: {[index: string]: object}
  ): Promise<void[]> {
    return Promise.all(
      Object.keys(devices).map(async (deviceId: string): Promise<void> => {
        const rawProps: {[index: string]: any} = devices[deviceId];

        if (!rawProps.device) {
          this.system.log.fatal(`Unknown device "${JSON.stringify(rawProps)}"`);
        }

        const manifest: DeviceManifest = devicesManifests[rawProps.device];
        const deviceConf: DeviceConf = await this.prepareDeviceConf(rawProps, manifest, deviceId);

        this.instances[deviceConf.deviceId] = await this.deviceFactory.create(deviceConf);
      })
    );
  }

  /**
   * Get device instance
   */
  getDevice(deviceId: string): Device {
    return this.instances[deviceId];
  }

  /**
   * Prepare config for device instantiating.
   * @param {object} rawInstanceProps - config of certain device from devices config.
   * @param {DeviceManifest} manifest - parsed device manifest
   * @param {string} deviceId - Uniq instance id like "bedroom.switch"
   * @return {Promise<object>} - complete device config
   * @private
   */
  private async prepareDeviceConf(
    rawInstanceProps: {[index: string]: any},
    manifest: DeviceManifest,
    deviceId: string
  ): Promise<DeviceConf> {
    if (!manifest) {
      throw new Error(`Can't find manifest of device "${rawInstanceProps.device}"`);
    }

    //const { baseName: placement, name } = helpers.splitLastPartOfPath(deviceId);
    // const schemaPath: string = path.resolve(manifest.baseDir, manifest.schema);
    // const schema: DeviceSchema = await this.system.io.loadYamlFile(schemaPath) as DeviceSchema;

    return {
      className: rawInstanceProps.device,
      deviceId,
      // TODO: это делать в парсинге конфига
      props: this.mergeProps(rawInstanceProps.device, _omit(rawInstanceProps, 'device'), manifest.props),
      // remove props from manifest
      manifest: _omit(manifest, 'props'),
    };
  }

  destroy() {

    // TODO: make
    // TODO: use async
    // TODO: событие поднять в App

    // // run destroy of devices instances
    // _.each(this._devicesInstances, (device) => {
    //   device.destroy && device.destroy();
    // });
    //
    // this._app.events.emit(`app.afterDestroy`);
  }

  private mergeProps(
    className: string,
    instanceProps: {[index: string]: any},
    manifestProps?: {[index: string]: any}
  ): {[index: string]: any} {
    return {
      // default props from device's manifest
      ...manifestProps,
      // default props from config.devicesDefaults
      ...this.system.host.config.devicesDefaults && this.system.host.config.devicesDefaults[className],
      // specified props for certain instance
      ...instanceProps,
    };
  }

}
