import Register from './Register';
import PluginEnv from './PluginEnv';
import Entities from './Entities';
import MasterConfig from './MasterConfig';
import Definitions from './Definitions';
import HostsFilesSet from './HostsFilesSet';
import systemPlugin from './systemPlugin';
import * as Io from './Io';
import * as defaultLogger from './defaultLogger';
import HostsFilesWriter from './HostsFilesWriter';
import validatePlatformDevs from './validatePlatformDevs';
import HostClassNames from './HostClassNames';


export default class BuildHostsEnv {
  readonly masterConfig: MasterConfig;
  readonly register: Register;
  readonly entities: Entities;
  readonly hostClassNames: HostClassNames;
  readonly definitions: Definitions;
  readonly hostsFilesSet: HostsFilesSet;
  readonly hostsFilesWriter: HostsFilesWriter;
  readonly log = defaultLogger;
  readonly io = Io;
  private readonly pluginEnv: PluginEnv;


  // TODO: import BuildEntities

  constructor(absMasterConfigPath: string, absBuildDir?: string) {
    this.masterConfig = new MasterConfig(absMasterConfigPath, absBuildDir);
    this.register = new Register(this.io);
    this.entities = new Entities(this.io, this.register);
    this.hostClassNames = new HostClassNames(this.masterConfig, this.entities);
    this.definitions = new Definitions(this.masterConfig, this.entities, this.hostClassNames);
    this.hostsFilesSet = new HostsFilesSet(this.entities, this.hostClassNames, this.definitions);
    this.hostsFilesWriter = new HostsFilesWriter(this);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.entities);
  }

  async init() {
    await this.masterConfig.init();
  }

  async collect() {
    this.log.info(`--> Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`--> Resolving and preparing entities`);
    await this.entities.generate();

    this.log.info(`--> Generating hosts entities definitions`);
    await this.definitions.generate();

    this.log.info(`--> Checking platform dev dependencies`);
    validatePlatformDevs(this);

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    this.pluginEnv.$riseAfterInit();
  }

  /**
   * Write all the hosts files to storage
   */
  async writeToStorage(skipMaster?: boolean) {
    this.log.info(`--> Write hosts files`);

    await this.hostsFilesWriter.writeHostsConfigsFiles(skipMaster);
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
