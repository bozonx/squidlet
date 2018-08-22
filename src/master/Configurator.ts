import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Registrator from './Registrator';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly registrator: Registrator = new Registrator();

  constructor(masterConfig: {[index: string]: any}) {
    // TODO: validate config
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;

    this.init();
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

  private init() {
    // TODO: register system devices, plugins and services - можно сделать через плагин
    // TODO: запускается инициализация плагинов
    // TODO: разбор и резолв манифестов

  }

}
