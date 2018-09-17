import PreMasterConfig from './interfaces/PreMasterConfig';
import Register from './Register';
import PluginEnv from './PluginEnv';
import Entities from './Entities';
import MasterConfig from './MasterConfig';
import Definitions from './Definitions';
import HostsFilesSet from './HostsFilesSet';
import systemPlugin from './systemPlugin';
import * as Io from './IO';
import * as defaultLogger from './defaultLogger';
import HostsFilesWriter from './HostsFilesWriter';


export default class Main {
  readonly masterConfig: MasterConfig;
  readonly register: Register;
  readonly entities: Entities;
  readonly definitions: Definitions;
  readonly hostsFilesSet: HostsFilesSet;
  readonly hostsFilesWriter: HostsFilesWriter;
  readonly log = defaultLogger;
  readonly io = Io;
  private readonly pluginEnv: PluginEnv;


  constructor(masterConfig: PreMasterConfig, masterConfigPath: string) {
    this.masterConfig = new MasterConfig(this, masterConfig, masterConfigPath);
    this.register = new Register(this);
    this.entities = new Entities(this);
    this.definitions = new Definitions(this);
    this.hostsFilesSet = new HostsFilesSet(this);
    this.hostsFilesWriter = new HostsFilesWriter(this);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.entities);
  }

  async collect() {
    this.log.info(`preparing configs`);
    this.masterConfig.generate();

    this.log.info(`Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`Resolving and preparing entities`);
    await this.entities.generate();

    this.log.info(`Generating hosts entities definitions`);
    this.definitions.generate();

    this.log.info(`Initialization has finished`);
    // call handlers after init
    this.pluginEnv.$riseAfterInit();
  }

  /**
   * Write all the hosts and entities files to storage
   */
  async writeToStorage(skipMaster?: boolean) {
    this.log.info(`Write hosts files`);
    await this.hostsFilesWriter.writeEntitiesFiles();
    await this.hostsFilesWriter.writeHostsFiles(skipMaster);
  }


  /**
   * Start registering step of initialization
   */
  private async registering(): Promise<void> {
    // register system plugin which registering system devices, drivers and services
    this.register.addPlugin(systemPlugin);

    // register plugins specified in config
    if (this.masterConfig.plugins) {
      for (let pluginPath of this.masterConfig.plugins) {
        this.register.addPlugin(pluginPath);
      }
    }

    // initialize all the plugins
    await this.register.initPlugins(this.pluginEnv);
    // wait for all the registering processes. It needs if plugin doesn't wait for register promise.
    await Promise.all(this.register.getRegisteringPromises());
  }

}
