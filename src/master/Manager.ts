import MasterConfig from './interfaces/MasterConfig';
import Register from './Register';


/**
 * This manager is passed to plugins.
 */
export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;


  constructor(masterConfig: MasterConfig, register: Register) {
    this.masterConfig = masterConfig;
    this.register = register;
  }

  getConfig() {
    // TODO: клонировать или делать immutable
    return this.masterConfig;
  }

  addPlugin: Register['addPlugin'] = (plugin) => {
    this.register.addPlugin(plugin);
  }

  addDevice: Register['addDevice'] = (manifest) => {
    this.register.addDevice(manifest);
  }

  addDriver: Register['addDriver'] = (manifest) => {
    this.register.addDriver(manifest);
  }

  addService: Register['addService'] = (manifest) => {
    this.register.addService(manifest);
  }

  afterInit(handler: () => void) {
    // TODO: навешаться на событие которое вызывается после инициализации плагинов и тд
  }

}
