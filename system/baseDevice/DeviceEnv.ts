import DeviceManifest from '../interfaces/DeviceManifest';
import EnvBase from '../entities/EnvBase';
import CategorizedEvents from '../helpers/CategorizedEvents';
import Host from '../Host';
import System from '../System';


/**
 * It is environment for devices and services
 */
export default class DeviceEnv extends EnvBase {
  readonly events: CategorizedEvents;
  readonly host: Host;

  constructor(system: System) {
    super(system);
    this.events = system.events;
    this.host = system.host;
  }

  async loadManifest(className: string): Promise<DeviceManifest> {
    return this.system.envSet.loadManifest<DeviceManifest>('devices', className);
  }

}
