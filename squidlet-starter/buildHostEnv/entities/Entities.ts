import Register from './Register';
import EntitiesSet from './EntitiesSet';
import MasterConfig from '../MasterConfig';
import PluginEnv from './PluginEnv';
import Io from '../Io';
import systemPlugin from '../systemPlugin';
import Logger from '../interfaces/Logger';


export default class Entities {
  readonly masterConfig: MasterConfig;
  readonly log: Logger;
  readonly register: Register;
  readonly entitiesSet: EntitiesSet;
  readonly pluginEnv: PluginEnv;
  private readonly io = new Io();

  constructor(log: Logger, masterConfig: MasterConfig) {
    this.log = log;
    this.masterConfig = masterConfig;
    this.register = new Register(this.io);
    this.entitiesSet = new EntitiesSet(this.io, this.register);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.entitiesSet);
  }


  async start() {
    this.log.info(`--> Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`--> Resolving and preparing entities`);
    await this.entitiesSet.generate();
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
