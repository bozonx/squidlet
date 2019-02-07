import * as EventEmitter from 'events';

import Register from './Register';
import EntitiesCollection from './EntitiesCollection';
import ConfigManager from '../ConfigManager';
import SrcEntitiesSet from '../interfaces/EntitySet';


const AFTER_INIT_EVENT = 'afterInit';


/**
 * This manager is passed to plugins.
 */
export default class PluginEnv {
  readonly configManager: ConfigManager;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly register: Register;
  private readonly entities: EntitiesCollection;

  constructor(
    configManager: ConfigManager,
    register: Register,
    entities: EntitiesCollection,
  ) {
    this.configManager = configManager;
    this.register = register;
    this.entities = entities;
  }

  getEntitiesSet(): SrcEntitiesSet {
    return this.entities.getEntitiesSet();
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
