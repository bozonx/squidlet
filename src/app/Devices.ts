import * as path from 'path';
import * as _ from 'lodash';

import App from './App';
import Device from './interfaces/Device';
import DeviceFactory from './DeviceFactory';
import { findRecursively } from '../helpers/helpers';


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
  init(devicesManifests: object, devicesConfigs: object): Promise<void[]> {
    return Promise.all(_.map(devicesConfigs, async (rawDeviceConf, deviceId): Promise<void> => {
      const manifest = devicesManifests[rawDeviceConf.device];
      const deviceConf = await this.prepareDeviceConf(rawDeviceConf, manifest, deviceId);
      // TODO: review
      // save link to device
      const builder = this.deviceFactory(this.app, deviceConf);

      this.instances[deviceConf.instanceId] = await builder.create();
    }));
  }

  /**
   * Get device instance
   */
  getDevice(deviceId: string): Device {
    return this.instances[deviceId];
  }

  /**
   * Prepare config for device instantiating.
   * @param {object} userDefinedDeviceConf - config of certain device from devices config.
   * @param {object} manifest - parsed device manifest
   * @param {string} instanceId - Uniq instance id like "bedroom.switch"
   * @return {Promise<object>} - complete device config
   * @private
   */
  private async prepareDeviceConf(userDefinedDeviceConf, manifest, instanceId) {
    if (!userDefinedDeviceConf.device) {
      this.app.log.fatal(`Unknown device "${JSON.stringify(userDefinedDeviceConf)}"`);
    }
    if (!manifest) {
      throw new Error(`Can't find manifest of device "${userDefinedDeviceConf.device}"`);
    }
    if (!manifest.schema) {
      throw new Error(`Manifest of device "${userDefinedDeviceConf.device}" doesn't have a schema`);
    }

    const { baseName: placement, name } = helpers.splitLastPartOfPath(instanceId);
    const schemaPath = path.resolve(manifest.baseDir, manifest.schema);
    const schema = await this._app.system.loadYamlFile(schemaPath);
    const deviceTopic = instanceId.replace(/\./g, '/');

    return {
      ...userDefinedDeviceConf,
      placement,
      manifest,
      schema,
      deviceTopic,
      instanceId,
      // TODO: зачем нужен name????
      name,
    };
  }

}
