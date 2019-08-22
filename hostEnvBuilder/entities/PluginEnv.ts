import {EntityType} from '../../system/interfaces/EntityTypes';
import IndexedEvents from '../../system/lib/IndexedEvents';
import Register from './Register';
import ConfigManager from '../hostConfig/ConfigManager';
import {HostEntitiesSet} from '../interfaces/HostEntitySet';
import UsedEntities from './UsedEntities';
import MachineConfig from '../interfaces/MachineConfig';


/**
 * This manager is passed to plugins.
 */
export default class PluginEnv {
  readonly configManager: ConfigManager;
  private afterRegisterEvents = new IndexedEvents<() => void>();
  private afterInitEvents = new IndexedEvents<() => void>();

  private readonly register: Register;
  private readonly usedEntities: UsedEntities;


  constructor(
    configManager: ConfigManager,
    register: Register,
    usedEntities: UsedEntities,
  ) {
    this.configManager = configManager;
    this.register = register;
    this.usedEntities = usedEntities;
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

  /**
   * Register entity on host.
   * Call it after registering.
   */
  addUsedEntity = async (entityType: EntityType, className: string) => {
    // TODO: промис специально опущен ???
    this.usedEntities.addEntity(entityType, className);
  }

  getMachineConfig(): MachineConfig {
    return this.configManager.machineConfig;
  }

  /**
   * Get all the used entities on host
   * Call it after registering.
   */
  getEntitiesSet(): HostEntitiesSet {
    return this.usedEntities.getEntitiesSet();
  }

  /**
   * Get ios list.
   * Call it after registering.
   */
  getIos = (): string[] => {
    return this.usedEntities.getUsedIo();
  }

  afterRegistering(handler: () => void) {
    this.afterRegisterEvents.addListener(handler);
  }

  afterInit(handler: () => void) {
    this.afterInitEvents.addListener(handler);
  }


  async $riseAfterRegistering() {
    await this.afterRegisterEvents.emitSync();
  }

  async $riseAfterInit() {
    await this.afterInitEvents.emitSync();
  }

}
