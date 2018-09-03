import PreMasterConfig from './interfaces/PreMasterConfig';
import Register from './Register';
import Entities, {AllManifests} from './Entities';
import HostsConfigsSet from './HostsConfigsSet';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import * as EventEmitter from 'events';


const AFTER_INIT_EVENT = 'afterInit';


/**
 * This manager is passed to plugins.
 */
export default class PluginEnv {
  private readonly events: EventEmitter = new EventEmitter();

  // TODO: remake

  private readonly masterConfig: PreMasterConfig;
  private readonly register: Register;
  private readonly entities: Entities;
  private readonly hostsConfigSet: HostsConfigsSet;


  constructor(
    masterConfig: PreMasterConfig,
    register: Register,
    entities: Entities,
    hostsConfigSet: HostsConfigsSet
  ) {
    this.masterConfig = masterConfig;
    this.register = register;
    this.entities = entities;
    this.hostsConfigSet = hostsConfigSet;
  }

  getMasterConfig() {
    // TODO: клонировать или делать immutable
    return this.masterConfig;
  }

  getManifests(): AllManifests {
    return this.entities.getManifests();
  }

  getHostsConfigs(): {[index: string]: HostConfig} {
    return this.hostsConfigSet.getHostsConfigs();
  }

  addPlugin: Register['addPlugin'] = (plugin) => {
    this.register.addPlugin(plugin);
  }

  addDevice: Register['addDevice'] = async (manifest) => {
    await this.register.addDevice(manifest);
  }

  addDriver: Register['addDriver'] = async (manifest) => {
    await this.register.addDriver(manifest);
  }

  addService: Register['addService'] = async (manifest) => {
    await this.register.addService(manifest);
  }

  afterInit(handler: () => void) {
    this.events.addListener(AFTER_INIT_EVENT, handler);
  }

  $riseAfterInit() {
    this.events.emit(AFTER_INIT_EVENT);
  }

}
