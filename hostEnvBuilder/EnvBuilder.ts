import Entities from './entities/Entities';
import MasterConfig from './MasterConfig';
import Definitions from './hostEnv/Definitions';
import HostsFilesSet from './hostEnv/HostsFilesSet';
import HostsFilesWriter from './hostEnv/HostsFilesWriter';
import validatePlatformDevs from './validatePlatformDevs';
import HostClassNames from './hostEnv/HostClassNames';
import Io from './Io';
import * as defaultLogger from './defaultLogger';
import Logger from './interfaces/Logger';
import {SrcHostFilesSet} from '../host/interfaces/HostFilesSet';
import EntitiesWriter from './entities/EntitiesWriter';


//export const ENTITIES_BUILD_DEFAULT_DIR = '../build/entities';


export default class EnvBuilder {
  private readonly masterConfig: MasterConfig;
  private readonly entities: Entities;
  private readonly entitiesWriter: EntitiesWriter;
  private readonly hostClassNames: HostClassNames;
  private readonly definitions: Definitions;
  private readonly hostsFilesSet: HostsFilesSet;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly log: Logger = defaultLogger;
  private readonly io = new Io();


  constructor(absMasterConfigPath: string, absEntitiesBuildDir?: string, absBuildDir?: string) {
    // TODO: absBuildDir - это место куда только hosts билдится
    // TODO: absEntitiesBuildDir и absBuildDir - если указываются то используются
    this.masterConfig = new MasterConfig(this.io, absMasterConfigPath, absBuildDir);
    this.entities = new Entities(this.log, this.masterConfig);
    this.entitiesWriter = new EntitiesWriter(this.io, this.masterConfig, this.entities.entitiesCollection);
    this.hostClassNames = new HostClassNames(this.masterConfig, this.entities.entitiesCollection);
    this.definitions = new Definitions(this.masterConfig, this.entities.entitiesCollection, this.hostClassNames);
    this.hostsFilesSet = new HostsFilesSet(this.entities.entitiesCollection, this.hostClassNames, this.definitions);
    this.hostsFilesWriter = new HostsFilesWriter(
      this.io,
      this.masterConfig,
      this.hostClassNames,
      this. hostsFilesSet
    );
  }


  async collect() {
    await this.masterConfig.init();
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
   * Write entities files to storage
   */
  async writeEntities() {
    this.log.info(`--> Writing entities files`);

    await this.entitiesWriter.write();
  }

  /**
   * Write all the hosts files to storage
   */
  async write(skipMaster?: boolean) {
    this.log.info(`--> Writing hosts files`);

    await this.hostsFilesWriter.writeHostsConfigsFiles(skipMaster);
  }

  /**
   * Generate master host config with integrated files set which points to original (ts or js) files
   */
  generateMasterConfigSet(): SrcHostFilesSet {
    // TODO: rename to srcConfigSet - смысл что там будут ссылки на сами ts файлы
    const hostId = 'master';

    return {
      ...this.hostsFilesSet.getDefinitionsSet(hostId),
      config: this.masterConfig.getFinalHostConfig(hostId),
      entitiesSet: this.hostsFilesSet.generateSrcEntitiesSet(hostId),
    };
  }

}
