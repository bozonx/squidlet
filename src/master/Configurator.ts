import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import Manager from './Manager';
import Manifests from './Manifests';
import systemPlugin from './systemPlugin';
import HostsConfig from './HostsConfig';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfig: HostsConfig;
  private readonly manager: Manager;


  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;
    this.register = new Register();
    this.manifests = new Manifests();
    this.hostsConfig = new HostsConfig(this.masterConfig, this.manifests);
    // TODO: наверное передать лучше manifests, hostsConfig
    this.manager = new Manager(this.masterConfig, this.register);
  }

  init() {
    // register system plugin which registering system devices, drivers and services
    this.register.addPlugin(systemPlugin);

    // register plugins specified in config
    if (this.masterConfig.plugins) {
      for (let pluginPath of this.masterConfig.plugins) {
        this.register.addPlugin(pluginPath);
      }
    }

    // initialize all the plugins
    this.register.initPlugins(this.manager);

    // resolve and prepare manifest
    this.manifests.prepare();

    // generate hosts configs
    this.hostsConfig.generate();

    // TODO: формирование списка файлов и данных для отправки хостам
  }

}
