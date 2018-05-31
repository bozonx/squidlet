const _ = require('lodash');
const path = require('path');


class DeviceBuilder {
  constructor(app, deviceConf) {
    this._app = app;
    this._deviceConf = deviceConf;
  }

  async create() {
    // TODO: ????? зачем это сообщение
    this._app.log.info(`> Registering device "${this._deviceConf.device}" on topic "${this._deviceConf.deviceTopic}"`);

    // make instance of device
    const devicePath = path.resolve(this._deviceConf.manifest.baseDir, this._deviceConf.manifest.device);
    const DeviceClass = this._require(devicePath);
    const device = new DeviceClass(this._app, this._deviceConf);

    this._validateSchema(this._deviceConf);

    // TODO: add subscribers from schema

    // run own device validate method
    this._validateDevice(device, this._deviceConf);

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
  _validateDevice(device, deviceConf) {
    // own device validate method is optional
    if (!device.validate) return;

    // do validate of device config
    const invalidMsg = device.validate(deviceConf);

    if (_.isString(invalidMsg)) {
      this._app.log.fatal(`Invalid config for device "${deviceConf.deviceTopic}: ${invalidMsg}. Config: ${JSON.stringify(deviceConf)}"`);
    }
  }

  _validateSchema(deviceConf) {

    // TODO: test


    return;

    // TODO: check connection

    const recursive = (container, curPath) => {
      _.each(container, (item, name) => {
        const itemPath = _.trimStart(`${curPath}.${name}`, '.');

        if (_.isString(item)) {
          // TODO: validate type
        }
        else if (_.isPlainObject(item) && item.type) {
          // TODO: validate type
        }
        else if (_.isPlainObject(item)) {
          recursive(item, itemPath);
        }
        else {
          throw new Error(`Can't parse schema of device ${deviceName}`);
        }
      });

    };

    recursive(schema.params, '');
  }

  // it needs for test purpose
  _require(devicePath) {
    return require(devicePath);
  }

}


export default function (app, deviceConf) {
  return new DeviceBuilder(app, deviceConf);
}
