import * as EventEmitter from 'events';

import Register from './Register';
import EntitiesCollection from './EntitiesCollection';
import MasterConfig from '../MasterConfig';
import {SrcEntitiesSet} from '../../host/interfaces/EntitySet';


const AFTER_INIT_EVENT = 'afterInit';


/**
 * This manager is passed to plugins.
 */
export default class PluginEnv {
  readonly masterConfig: MasterConfig;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly register: Register;
  private readonly entities: EntitiesCollection;

  constructor(
    masterConfig: MasterConfig,
    register: Register,
    entities: EntitiesCollection,
  ) {
    this.masterConfig = masterConfig;
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
