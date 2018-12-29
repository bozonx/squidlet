import MasterConfig from './MasterConfig';
import Io from './Io';
import * as defaultLogger from './defaultLogger';
import Entities from './entities/Entities';
import EntitiesWriter from './entities/EntitiesWriter';
import Logger from './interfaces/Logger';


export default class BuildEntities {
  private readonly masterConfig: MasterConfig;
  private readonly entities: Entities;
  private readonly entitiesWriter: EntitiesWriter;
  private readonly log: Logger = defaultLogger;
  private readonly io = new Io();

  constructor(absMasterConfigPath: string, absBuildDir?: string) {
    this.masterConfig = new MasterConfig(this.io, absMasterConfigPath, absBuildDir);
    this.entities = new Entities(this.log, this.masterConfig);
    this.entitiesWriter = new EntitiesWriter(this.io, this.masterConfig, this.entities.entitiesSet);
  }

  async init() {
    await this.masterConfig.init();
  }


  async start() {
    await this.entities.start();

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    this.entities.pluginEnv.$riseAfterInit();
  }

  /**
   * Write entities files to storage
   */
  async write() {
    this.log.info(`--> Writing entities files`);

    await this.entitiesWriter.write();
  }


}
