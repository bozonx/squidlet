import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import Manager from './Manager';
import systemPlugin from './systemPlugin';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly manager: Manager;
  private readonly register: Register;


  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;
    this.register = new Register();
    this.manager = new Manager(this.masterConfig, this.register);
  }

  init() {
    // register system plugin which register system devices, drivers and services
    this.register.addPlugin(systemPlugin);

    // register plugins from config
    if (this.masterConfig.plugins) {
      for (let pluginPath of this.masterConfig.plugins) {
        this.register.addPlugin(pluginPath);
      }
    }

    // initialize all the plugins
    this.register.initPlugins(this.manager);

    // TODO: разбор и резолв манифестов
    // TODO: формирование конфигов хостов

  }

}
