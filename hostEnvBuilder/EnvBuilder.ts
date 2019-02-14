import ConfigManager from './ConfigManager';
import UsedEntities from './entities/UsedEntities';
import Definitions from './configSet/Definitions';
import ConfigsSet from './configSet/ConfigsSet';
import HostsConfigsWriter from './configSet/HostsConfigsWriter';
import validatePlatformDevs from './validatePlatformDevs';
import HostClassNames from './configSet/HostClassNames';
import Io from './Io';
import * as defaultLogger from './defaultLogger';
import Logger from './interfaces/Logger';
import SrcHostEnvSet from './interfaces/SrcHostEnvSet';
import EntitiesWriter from './entities/EntitiesWriter';
import PreHostConfig from './interfaces/PreHostConfig';
import systemEntitiesPlugin from '../entities/systemEntitiesPlugin';
import Register from './entities/Register';


export default class EnvBuilder {
  private readonly configManager: ConfigManager;
  private readonly register: Register;
  private readonly usedEntities: UsedEntities;
  private readonly entitiesWriter: EntitiesWriter;
  private readonly hostClassNames: HostClassNames;
  private readonly definitions: Definitions;
  private readonly configsSet: ConfigsSet;
  private readonly hostsConfigWriter: HostsConfigsWriter;
  private readonly log: Logger = defaultLogger;
  private readonly io = new Io();


  constructor(hostConfigOrConfigPath: string | PreHostConfig, absBuildDir?: string) {
    this.configManager = new ConfigManager(this.io, hostConfigOrConfigPath, absBuildDir);
    //this.entities = new Entities(this.log, this.configManager);
    this.register = new Register(this.io);
    this.usedEntities = new UsedEntities(this.io, this.configManager, this.register);
    this.hostClassNames = new HostClassNames(this.configManager, this.entities.entitiesCollection);
    this.entitiesWriter = new EntitiesWriter(
      this.io,
      this.log,
      this.configManager,
      this.entities.entitiesCollection,
      this.entities.register,
      this.hostClassNames
    );
    this.definitions = new Definitions(this.configManager, this.entities.entitiesCollection, this.hostClassNames);
    this.configsSet = new ConfigsSet(
      this.configManager,
      this.entities.entitiesCollection,
      this.hostClassNames,
      this.definitions
    );
    this.hostsConfigWriter = new HostsConfigsWriter(
      this.io,
      this.configManager,
      this.hostClassNames,
      this. configsSet
    );
  }


  async collect() {
    await this.configManager.init();
    this.log.info(`--> Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`--> Resolving and preparing entities which is used on host`);
    await this.usedEntities.generate();

    this.log.info(`--> Generating hosts entities definitions`);
    await this.definitions.generate();

    this.log.info(`--> Checking platform dev dependencies`);
    validatePlatformDevs(this);

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    this.entities.pluginEnv.$riseAfterInit();
  }

  /**
   * Write entities files to storage
   */
  async writeEntities() {
    this.log.info(`--> Writing entities files`);

    await this.entitiesWriter.writeUsed();
  }

  /**
   * Write all the host's files to storage
   */
  async writeConfigs() {
    this.log.info(`--> Writing host configs`);

    await this.hostsConfigWriter.write();
  }

  /**
   * Generate host config with integrated files set which points to original (ts or js) files.
   * It uses only to start in nodejs environment.
   */
  generateSrcConfigSet(): SrcHostEnvSet {
    return {
      configs: this.configsSet.getConfigSet(),
      entities: this.configsSet.generateSrcEntitiesSet(),
    };
  }


  /**
   * Start registering step of initialization
   */
  private async registering(): Promise<void> {
    // register system plugin which registering system devices, drivers and services
    this.register.addPlugin(systemEntitiesPlugin);

    // register plugins specified in config
    if (this.configManager.plugins) {
      for (let pluginPath of this.configManager.plugins) {
        this.register.addPlugin(pluginPath);
      }
    }

    // initialize all the plugins
    await this.register.initPlugins(this.pluginEnv);
    // wait for all the registering processes. It needs if plugin doesn't wait for register promise.
    await Promise.all(this.register.getRegisteringPromises());
  }

}
