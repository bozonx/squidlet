import * as path from 'path';
import * as _ from 'lodash';

import App from './App';
import Device from './interfaces/Device';
import DeviceFactory from './DeviceFactory';
import DeviceManifest from './interfaces/DeviceManifest';
import DeviceConf from './interfaces/DeviceConf';
import DeviceSchema from './interfaces/DeviceSchema';


/**
 * Creates instances of local devices and prepare config for them.
 */
export default class Devices {
  private readonly app: App;
  // devices instances by ids
  private readonly instances: object = {};
  private readonly deviceFactory = DeviceFactory;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Initialize all the devices on current host specified by manifests
   * and using user defined config for devices.
   * @param {object} devicesManifests - parsed devices manifests.
   *                                   Structure like { DeviceName: { ...manifest } }
   * @param {object} devicesConfigs - user defined devices configs by ids { "room.device": { ...deviceConfig } }
   */
  init(
    devicesManifests: {[index: string]: DeviceManifest},
    devicesConfigs: {[index: string]: object}
  ): Promise<void[]> {
    return Promise.all(
      _.map(devicesConfigs, async (rawDeviceConf: {[index: string]: any}, deviceId: string): Promise<void> => {
        if (!rawDeviceConf.device) {
          this.app.log.fatal(`Unknown device "${JSON.stringify(rawDeviceConf)}"`);
        }

        const manifest: DeviceManifest = devicesManifests[rawDeviceConf.device];
        const deviceConf = await this.prepareDeviceConf(rawDeviceConf, manifest, deviceId);

        // TODO: review
        // save link to device
        const builder = this.deviceFactory(this.app, deviceConf);

        this.instances[deviceConf.deviceId] = await builder.create();
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
   * @param {object} rawDeviceConf - config of certain device from devices config.
   * @param {DeviceManifest} manifest - parsed device manifest
   * @param {string} deviceId - Uniq instance id like "bedroom.switch"
   * @return {Promise<object>} - complete device config
   * @private
   */
  private async prepareDeviceConf(
    rawDeviceConf: {[index: string]: any},
    manifest: DeviceManifest,
    deviceId: string
  ): Promise<DeviceConf> {
    if (!manifest) {
      throw new Error(`Can't find manifest of device "${rawDeviceConf.device}"`);
    }

    //const { baseName: placement, name } = helpers.splitLastPartOfPath(deviceId);
    const schemaPath: string = path.resolve(manifest.baseDir, manifest.schema);
    const schema: DeviceSchema = await this.app.system.loadYamlFile(schemaPath) as DeviceSchema;

    return {
      className: rawDeviceConf.device,
      deviceId,
      params: _.omit(rawDeviceConf, 'device'),
      manifest,
      schema,
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

}
