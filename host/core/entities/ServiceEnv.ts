import ServiceManifest from '../interfaces/ServiceManifest';
import EnvBase from './EnvBase';
import Events from '../Events';
import Host from '../Host';
import Devices from '../Devices';
import System from '../System';


/**
 * It is environment for devices and services
 */
export default class ServiceEnv extends EnvBase {
  readonly events: Events;
  readonly host: Host;
  readonly devices: Devices;

  constructor(system: System) {
    super(system);
    this.events = system.events;
    this.host = system.host;
    this.devices = system.devices;
  }

  async loadManifest(className: string): Promise<ServiceManifest> {
    return this.system.configSet.loadManifest<ServiceManifest>('services', className);
  }

}
