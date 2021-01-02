import ConfigManager from './hostConfig/ConfigManager';
import UsedEntities from './entities/UsedEntities';
import Definitions from './configSet/Definitions';
import ConfigsSet from './configSet/ConfigsSet';
import ConfigsWriter from './configSet/ConfigsWriter';
import Os from '../shared/helpers/Os';
import * as defaultLogger from './defaultLogger';
import Logger from '../../../squidlet-networking/src/interfaces/Logger';
import HostEnvSet from './interfaces/HostEnvSet';
import EntitiesWriter from './entities/EntitiesWriter';
import PreHostConfig from './interfaces/PreHostConfig';
import systemEntitiesPlugin from '../entities/systemEntitiesPlugin';
import Register from './entities/Register';
import PluginEnv from './entities/PluginEnv';
import {checkIoExistance} from './helpers';
import {OwnerOptions} from '../shared/interfaces/OnwerOptions';
import Platforms from '../system/interfaces/Platforms';


export default class EnvBuilder {
  readonly usedEntities: UsedEntities;
  readonly configManager: ConfigManager;

  private readonly tmpBuildDir: string;
  // env build dir
  private readonly buildDir: string;
  private readonly pluginEnv: PluginEnv;
  private readonly register: Register;
  private readonly entitiesWriter: EntitiesWriter;
  private readonly definitions: Definitions;
  private readonly configsSet: ConfigsSet;
  private readonly configsWriter: ConfigsWriter;
  private readonly log: Logger = defaultLogger;
  private readonly os = new Os();


  constructor(
    hostConfigOrConfigPath: string | PreHostConfig,
    absEnvBuildDir: string,
    tmpBuildDir: string,
    platform: Platforms,
    machine: string,
    ownerOptions?: OwnerOptions
  ) {
    this.buildDir = absEnvBuildDir;
    this.tmpBuildDir = tmpBuildDir;
    this.configManager = new ConfigManager(this.os, hostConfigOrConfigPath, platform, machine);
    this.register = new Register(this.os);
    this.usedEntities = new UsedEntities(this.configManager, this.register);
    this.pluginEnv = new PluginEnv(this.configManager, this.register, this.usedEntities);
    this.entitiesWriter = new EntitiesWriter(
      this.os,
      this.log,
      this.usedEntities,
      this.buildDir,
      this.tmpBuildDir,
      ownerOptions
    );
    this.definitions = new Definitions(this.configManager, this.usedEntities);
    this.configsSet = new ConfigsSet(this.configManager, this.usedEntities, this.definitions);
    this.configsWriter = new ConfigsWriter(this.os, this.configsSet, this.buildDir, ownerOptions);
  }


  async collect() {
    await this.configManager.init();
    this.log.info(`--> Registering plugins, devices, drivers and services`);
    await this.registering();

    // call handlers after registering
    await this.pluginEnv.$riseAfterRegistering();

    this.log.info(`--> Resolving and preparing entities which is used on host`);
    await this.usedEntities.generate();

    this.log.info(`--> Generating hosts entities definitions`);
    await this.definitions.generate();

    this.log.info(`--> Checking platform io dependencies`);
    checkIoExistance(this.usedEntities.getUsedIo(), this.configManager.getMachineIos());

    try {
      checkIoExistance(Object.keys(this.configManager.iosDefinitions), this.configManager.getMachineIos());
    }
    catch (err) {
      throw new Error(`Invalid config's ios definitions: ${err}`);
    }

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    await this.pluginEnv.$riseAfterInit();
  }

  /**
   * Write configs and entities files
   */
  async writeEnv() {
    await this.writeConfigs();
    await this.writeEntities();
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

    await this.configsWriter.write();
  }

  /**
   * Generate host config and entities where src points to original (ts) files.
   * It uses only in nodejs environment.
   */
  generateDevelopEnvSet(): HostEnvSet {
    return {
      configs: this.configsSet.getConfigSet(),
      entities: this.usedEntities.getEntitiesSet(),
    };
  }

  /**
   * Generate host config and entities without a "srcDir" property in manifests.
   * It uses only in nodejs environment.
   */
  generateProdEnvSet(): HostEnvSet {
    return {
      configs: this.configsSet.getConfigSet(),
      entities: this.usedEntities.getProdEntitiesSet(),
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
