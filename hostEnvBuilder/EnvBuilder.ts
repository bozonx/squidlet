import Entities from './entities/Entities';
import ConfigManager from './ConfigManager';
import Definitions from './hostEnv/Definitions';
import ConfigsSet from './hostEnv/ConfigsSet';
import HostsConfigsWriter from './hostEnv/HostsConfigsWriter';
import validatePlatformDevs from './validatePlatformDevs';
import HostClassNames from './hostEnv/HostClassNames';
import Io from './Io';
import * as defaultLogger from './defaultLogger';
import Logger from './interfaces/Logger';
import {SrcHostFilesSet} from '../host/interfaces/HostFilesSet';
import EntitiesWriter from './entities/EntitiesWriter';


export default class EnvBuilder {
  private readonly configManager: ConfigManager;
  private readonly entities: Entities;
  private readonly entitiesWriter: EntitiesWriter;
  private readonly hostClassNames: HostClassNames;
  private readonly definitions: Definitions;
  private readonly configsSet: ConfigsSet;
  private readonly hostsConfigWriter: HostsConfigsWriter;
  private readonly log: Logger = defaultLogger;
  private readonly io = new Io();


  constructor(absMasterConfigPath: string, absBuildDir?: string) {
    this.configManager = new ConfigManager(this.io, absMasterConfigPath, absBuildDir);
    this.entities = new Entities(this.log, this.configManager);
    this.entitiesWriter = new EntitiesWriter(this.io, this.configManager, this.entities.entitiesCollection);
    this.hostClassNames = new HostClassNames(this.configManager, this.entities.entitiesCollection);
    this.definitions = new Definitions(this.configManager, this.entities.entitiesCollection, this.hostClassNames);
    this.configsSet = new ConfigsSet(this.entities.entitiesCollection, this.hostClassNames, this.definitions);
    this.hostsConfigWriter = new HostsConfigsWriter(
      this.io,
      this.configManager,
      this.hostClassNames,
      this. configsSet
    );
  }


  async collect() {
    await this.configManager.init();
    await this.entities.start();

    this.log.info(`--> Generating hosts entities definitions`);
    await this.definitions.generate();

    this.log.info(`--> Checking platform dev dependencies`);
    validatePlatformDevs(this);

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    this.entities.pluginEnv.$riseAfterInit();
  }

  // /**
  //  * Write entities files to storage
  //  */
  // async writeEntities() {
  //   this.log.info(`--> Writing entities files`);
  //
  //   await this.entitiesWriter.write();
  // }

  /**
   * Write all the host's files to storage
   */
  async write() {
    this.log.info(`--> Writing host configs`);

    await this.hostsConfigWriter.writeHostsConfigsFiles();

    // TODO: write entities of host
  }

  /**
   * Generate host config with integrated files set which points to original (ts or js) files.
   * It uses only to start in nodejs environment.
   */
  generateSrcConfigSet(): SrcHostFilesSet {

    // TODO: поидее должно напоминать файловую структура

    return {
      ...this.configsSet.getDefinitionsSet(),
      config: this.configManager.hostConfig,
      entitiesSet: this.configsSet.generateSrcEntitiesSet(),
    };
  }

}
