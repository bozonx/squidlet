import * as _ from 'lodash';

import App from './App';
import Device from './interfaces/Device';
import DeviceFactory from './DeviceFactory';


export default class Devices {
  private readonly app: App;
  // devices instances by ids
  private readonly instances: object = {};
  private readonly deviceFactory = DeviceFactory;

  constructor(app) {
    this.app = app;
  }

  /**
   * Initialize all the devices on current host specified by manifests
   * and using user defined config for devices.
   * @param {object} devicesManifests - parsed devices manifests.
   *                                   Structure like { DeviceName: { ...manifest } }
   * @param {object} devicesConfig - user defined devices configs
   */
  async init(devicesManifests: object, devicesConfig: object): Promise<void> {
    const recursively = async (container, containerPath) => {
      if (!_.isPlainObject(container)) return;

      if (container.device) {
        // device has found - init it
        return await this._initDevice(devicesManifests, container, containerPath);
      }

      // go deeper
      await Promise.all(_.map(container, (item, name) => {
        const itemPath = _.trimStart(`${containerPath}.${name}`, '.');

        return recursively(item, itemPath);
      }));
    };

    await recursively(devicesConfig, '');
  }

  /**
   * Get device instance
   */
  getDevice(deviceId: string): Device {
    return this.instances[deviceId];
  }


  private async _initDevice(devicesManifests, rawDeviceConf: object, containerPath: string): Promise<void> {
    const manifest = devicesManifests[rawDeviceConf.device];
    const deviceConf = await this.prepareDeviceConf(rawDeviceConf, manifest, containerPath);

    // save link to device
    const builder = this.deviceFactory(this.app, deviceConf);
    this.instances[deviceConf.instanceId] = await builder.create();
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
      this._app.log.fatal(`Unknown device "${JSON.stringify(userDefinedDeviceConf)}"`);
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
