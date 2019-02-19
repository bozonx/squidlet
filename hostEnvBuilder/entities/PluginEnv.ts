import * as EventEmitter from 'events';

import Register from './Register';
import ConfigManager from '../ConfigManager';
import SrcEntitiesSet from '../interfaces/SrcEntitiesSet';
import UsedEntities from './UsedEntities';
import {ManifestsTypePluralName} from '../../host/interfaces/ManifestTypes';
import MachineConfig from '../interfaces/MachineConfig';


const AFTER_INIT_EVENT = 'afterInit';
const AFTER_REGISTERING_EVENT = 'afterRegister';


/**
 * This manager is passed to plugins.
 */
export default class PluginEnv {
  readonly configManager: ConfigManager;
  private readonly events: EventEmitter = new EventEmitter();
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
  addUsedEntity = async (pluralType: ManifestsTypePluralName, className: string) => {
    this.usedEntities.addEntity(pluralType, className);
  }

  getMachineConfig(): MachineConfig {
    return this.configManager.machineConfig;
  }

  /**
   * Get all the used entities on host
   * Call it after registering.
   */
  getEntitiesSet(): SrcEntitiesSet {
    return this.usedEntities.getEntitiesSet();
  }

  /**
   * Get devs list.
   * Call it after registering.
   */
  getDevs = (): string[] => {
    return this.usedEntities.getUsedDevs();
  }

  afterInit(handler: () => void) {
    this.events.addListener(AFTER_INIT_EVENT, handler);
  }

  afterRegistering(handler: () => void) {
    this.events.addListener(AFTER_REGISTERING_EVENT, handler);
  }


  $riseAfterInit() {
    // TODO: нужно чтобы все события дожидались промисов
    this.events.emit(AFTER_INIT_EVENT);
  }

  $riseAfterRegistering() {
    // TODO: нужно чтобы все события дожидались промисов
    this.events.emit(AFTER_REGISTERING_EVENT);
  }

}
