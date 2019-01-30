import DeviceManifest from '../interfaces/DeviceManifest';
import EnvBase from './EnvBase';
import Events from '../Events';
import Host from '../Host';
import Devices from '../Devices';
import System from '../System';


/**
 * It is environment for devices and services
 */
export default class DeviceEnv extends EnvBase {
  readonly events: Events;
  readonly host: Host;
  readonly devices: Devices;

  constructor(system: System) {
    super(system);
    this.events = system.events;
    this.host = system.host;
    this.devices = system.devices;
  }

  async loadManifest(className: string): Promise<DeviceManifest> {
    return this.system.configSet.loadManifest<DeviceManifest>('devices', className);
  }

}
