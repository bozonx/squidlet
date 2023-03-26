import {EntityType} from '../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/interfaces/EntityTypes.js';
import IndexedEvents from '../../../../squidlet-lib/src/IndexedEvents';
import Register from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/Register.js';
import ConfigManager from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/hostConfig/ConfigManager.js';
import {HostEntitiesSet} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/HostEntitySet.js';
import UsedEntities from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/entities/UsedEntities.js';
import MachineConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/hostEnvBuilder/interfaces/MachineConfig.js';


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
