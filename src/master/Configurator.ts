import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import systemPlugin from './systemPlugin';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly registrator: Register = new Register();


  constructor(masterConfig: {[index: string]: any}) {
    // TODO: validate config
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;

    this.init();
  }

  addPlugin: Register['addPlugin'] = (plugin) => {
    this.registrator.addPlugin(plugin);
  }

  addDevice: Register['addDevice'] = (manifest) => {
    this.registrator.addDevice(manifest);
  }

  addDriver: Register['addDriver'] = (manifest) => {
    this.registrator.addDriver(manifest);
  }

  addService: Register['addService'] = (manifest) => {
    this.registrator.addService(manifest);
  }

  private init() {
    this.addPlugin(systemPlugin);

    // register plugins from config
    if (this.masterConfig.plugins) {
      for (let pluginPath of this.masterConfig.plugins) {
        this.addPlugin(pluginPath);
      }
    }

    // initialize all the plugins
    this.registrator.initPlugins();

    // TODO: разбор и резолв манифестов
    // TODO: формирование конфигов хостов

  }

}
