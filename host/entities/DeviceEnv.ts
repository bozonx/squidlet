import DeviceManifest from '../interfaces/DeviceManifest';
import EnvBase from './EnvBase';
import Events from '../Events';
import Host from '../Host';
import System from '../System';


/**
 * It is environment for devices and services
 */
export default class DeviceEnv extends EnvBase {
  readonly events: Events;
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
