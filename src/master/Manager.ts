import MasterConfig from './interfaces/MasterConfig';
import Register from './Register';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register = new Register();


  constructor(masterConfig: MasterConfig) {
    this.masterConfig = masterConfig;
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

}
