import App from "../app/App";
import * as _ from "lodash";


export default class MasterConfigurator {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  init(): void {

  }

  async init222(devicesManifests: object, devicesConfig: object): Promise<void> {
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

  validateConfig() {
    if (!manifest.schema) {
      throw new Error(`Manifest of device "${rawDeviceConf.device}" doesn't have a schema`);
    }
  }

}
