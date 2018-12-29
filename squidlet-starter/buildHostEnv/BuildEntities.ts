import Register from './entities/Register';
import PluginEnv from './entities/PluginEnv';
import Entities from './entities/Entities';
import MasterConfig from './MasterConfig';
import systemPlugin from './systemPlugin';
import Io from './Io';
import * as defaultLogger from './defaultLogger';
import EntitiesWriter from './entities/EntitiesWriter';


export default class BuildEntities {
  readonly masterConfig: MasterConfig;
  readonly register: Register;
  readonly entities: Entities;
  readonly entitiesWriter: EntitiesWriter;
  readonly log = defaultLogger;
  readonly io = new Io();
  private readonly pluginEnv: PluginEnv;


  constructor(absMasterConfigPath: string, absBuildDir?: string) {
    this.masterConfig = new MasterConfig(this.io, absMasterConfigPath, absBuildDir);
    this.register = new Register(this.io);
    this.entities = new Entities(this.io, this.register);
    this.entitiesWriter = new EntitiesWriter(this.io, this.masterConfig, this.entities);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.entities);
  }

  async init() {
    await this.masterConfig.init();
  }

  async start() {
    this.log.info(`--> Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`--> Resolving and preparing entities`);
    await this.entities.generate();

    this.log.info(`--> Initialization has finished`);
    // call handlers after init
    this.pluginEnv.$riseAfterInit();
  }

  /**
   * Write entities files to storage
   */
  async writeToStorage(skipMaster?: boolean) {
    this.log.info(`--> Write entities files`);

    await this.entitiesWriter.write();
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
