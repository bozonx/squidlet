import ServiceManifest from '../interfaces/ServiceManifest';
import EnvBase from './EnvBase';
import Events from '../Events';
import Host from '../Host';
import System from '../System';


/**
 * It is environment for devices and services
 */
export default class ServiceEnv extends EnvBase {
  readonly events: Events;
  readonly host: Host;

  constructor(system: System) {
    super(system);
    this.events = system.events;
    this.host = system.host;
  }

  async loadManifest(className: string): Promise<ServiceManifest> {
    return this.system.configSet.loadManifest<ServiceManifest>('services', className);
  }

}
