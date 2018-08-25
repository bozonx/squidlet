import MasterConfig from './interfaces/MasterConfig';
import Register from './Register';
import Manifests from './Manifests';
import HostsConfigGenerator from './HostsConfigGenerator';
import ServiceManifest from '../app/interfaces/ServiceManifest';
import DriverManifest from '../app/interfaces/DriverManifest';
import DeviceManifest from '../app/interfaces/DeviceManifest';
import HostConfig from '../app/interfaces/HostConfig';
import * as EventEmitter from 'events';


const AFTER_INIT_EVENT = 'afterInit';


/**
 * This manager is passed to plugins.
 */
export default class Configurator {
  private readonly events: EventEmitter = new EventEmitter();
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;


  constructor(
    masterConfig: MasterConfig,
    register: Register,
    manifests: Manifests,
    hostsConfigGenerator: HostsConfigGenerator
  ) {
    this.masterConfig = masterConfig;
    this.register = register;
    this.manifests = manifests;
    this.hostsConfigGenerator = hostsConfigGenerator;
  }

  getConfig() {
    // TODO: клонировать или делать immutable
    return this.masterConfig;
  }

  getDevicesManifests(): DeviceManifest[] {
    return this.manifests.getDevicesManifests();
  }

  getDriversManifests(): DriverManifest[] {
    return this.manifests.getDriversManifests();
  }

  getServicesManifests(): ServiceManifest[] {
    return this.manifests.getServicesManifests();
  }

  getHostsConfig(): {[index: string]: HostConfig} {
    return this.hostsConfigGenerator.getHostsConfig();
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
