import ServiceManifest from '../interfaces/ServiceManifest';
import EnvBase from './EnvBase';
import Logger from '../interfaces/Logger';
import Events from '../Events';
import Host from '../Host';
import Messenger from '../../messenger/Messenger';
import Devices from '../Devices';
import System from '../System';


/**
 * It is environment for devices and services
 */
export default class ServiceEnv extends EnvBase {
  readonly log: Logger;
  readonly events: Events;
  readonly host: Host;
  readonly messenger: Messenger;
  readonly devices: Devices;

  constructor(system: System) {
    super(system);
    this.log = system.log;
    this.events = system.events;
    this.host = system.host;
    this.messenger = system.messenger;
    this.devices = system.devices;
  }

  async loadManifest(className: string): Promise<ServiceManifest> {

    // TODO: cache manifest for 1 minute

    return this.system.configSet.loadManifest<ServiceManifest>('services', className);
  }
}
