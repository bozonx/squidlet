import Entities from './entities/Entities';
import MasterConfig from './MasterConfig';
import Definitions from './hostEnv/Definitions';
import HostsFilesSet from './hostEnv/HostsFilesSet';
import HostsFilesWriter from './hostEnv/HostsFilesWriter';
import validatePlatformDevs from './hostEnv/validatePlatformDevs';
import HostClassNames from './hostEnv/HostClassNames';
import Io from './Io';
import * as defaultLogger from './defaultLogger';
import Logger from './interfaces/Logger';


export default class BuildHostsEnv {
  private readonly masterConfig: MasterConfig;
  private readonly entities: Entities;
  private readonly hostClassNames: HostClassNames;
  private readonly definitions: Definitions;
  private readonly hostsFilesSet: HostsFilesSet;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly log: Logger = defaultLogger;
  private readonly io = new Io();


  constructor(absMasterConfigPath: string, absBuildDir?: string) {
    this.masterConfig = new MasterConfig(this.io, absMasterConfigPath, absBuildDir);
    this.entities = new Entities(this.log, this.masterConfig);
    this.hostClassNames = new HostClassNames(this.masterConfig, this.entities.entitiesSet);
    this.definitions = new Definitions(this.masterConfig, this.entities.entitiesSet, this.hostClassNames);
    this.hostsFilesSet = new HostsFilesSet(this.entities, this.hostClassNames, this.definitions);
    this.hostsFilesWriter = new HostsFilesWriter(
      this.io,
      this.masterConfig,
      this.entities,
      this.hostClassNames,
      this. hostsFilesSet
    );
  }

  async init() {
    await this.masterConfig.init();
  }


  async collect() {
    await this.entities.start();

    this.log.info(`--> Generating hosts entities definitions`);
    await this.definitions.generate();

    this.log.info(`--> Checking platform dev dependencies`);
    validatePlatformDevs(this);

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    this.entities.pluginEnv.$riseAfterInit();
  }

  /**
   * Write all the hosts files to storage
   */
  async write(skipMaster?: boolean) {
    this.log.info(`--> Writing hosts files`);

    await this.hostsFilesWriter.writeHostsConfigsFiles(skipMaster);
  }

}
