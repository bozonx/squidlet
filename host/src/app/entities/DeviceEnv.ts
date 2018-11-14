import DeviceManifest from '../interfaces/DeviceManifest';
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
export default class DeviceEnv extends EnvBase {
  readonly events: Events;
  readonly host: Host;
  readonly messenger: Messenger;
  readonly devices: Devices;

  constructor(system: System) {
    super(system);
    this.events = system.events;
    this.host = system.host;
    this.messenger = system.messenger;
    this.devices = system.devices;
  }

  async loadManifest(className: string): Promise<DeviceManifest> {
    return this.system.configSet.loadManifest<DeviceManifest>('devices', className);
  }

}
