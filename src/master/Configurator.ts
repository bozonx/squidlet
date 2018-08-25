import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import Manager from './Manager';
import Manifests from './Manifests';
import systemPlugin from './systemPlugin';
import HostsConfigGenerator from './HostsConfigGenerator';
import HostsFilesGenerator from './HostsFilesGenerator';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;
  private readonly hostsFilesGenerator: HostsFilesGenerator;
  private readonly manager: Manager;


  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;
    this.register = new Register();
    this.manifests = new Manifests();
    this.hostsConfigGenerator = new HostsConfigGenerator(this.masterConfig, this.manifests);
    this.hostsFilesGenerator = new HostsFilesGenerator();
    this.manager = new Manager(this.masterConfig, this.register, this.manifests, this.hostsConfigGenerator);
  }

  async init() {
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

    // TODO: дождаться когда все файлы прогрузятся

    // resolve and prepare manifest
    await this.manifests.generate(
      this.register.getDevicesPreManifests(),
      this.register.getDriversPreManifests(),
      this.register.getServicesPreManifests()
    );

    // generate hosts configs
    this.hostsConfigGenerator.generate();

    // call after init handlers
    this.manager.$riseAfterInit();

    this.hostsFilesGenerator.generate();

    // TODO: поднять соединения к хостам, дождаться пока все станут доступны
    // TODO: если какие-то хосты не доступны то работать только с доступными, а на те написать ошибку
    // TODO: отправить данные доступным хостам
  }

}
