import DeviceManifest from '../interfaces/DeviceManifest';
import EnvBase from '../entities/EnvBase';


/**
 * It is environment for devices and services
 */
export default class DeviceEnv extends EnvBase {
  async loadManifest(className: string): Promise<DeviceManifest> {
    return this.system.envSet.loadManifest<DeviceManifest>('devices', className);
  }
}
