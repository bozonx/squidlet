import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Registrator from './Registrator';
import systemPlugin from './systemPlugin';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly registrator: Registrator = new Registrator();


  constructor(masterConfig: MasterConfig) {
    this.masterConfig = masterConfig;
  }

  addPlugin: Registrator['addPlugin'] = (plugin) => {
    this.registrator.addPlugin(plugin);
  }

  addDevice: Registrator['addDevice'] = (manifest) => {
    this.registrator.addDevice(manifest);
  }

  addDriver: Registrator['addDriver'] = (manifest) => {
    this.registrator.addDriver(manifest);
  }

  addService: Registrator['addService'] = (manifest) => {
    this.registrator.addService(manifest);
  }

}
