import Register from './Register';
import EntitiesCollection from './EntitiesCollection';
import ConfigManager from '../ConfigManager';
import PluginEnv from './PluginEnv';
import Io from '../Io';
import systemEntitiesPlugin from '../../entities/systemEntitiesPlugin';
import Logger from '../interfaces/Logger';


// TODO: наверное не нужно
export default class Entities {
  readonly configManager: ConfigManager;
  readonly log: Logger;
  readonly register: Register;
  readonly entitiesCollection: EntitiesCollection;
  readonly pluginEnv: PluginEnv;
  private readonly io = new Io();


  constructor(log: Logger, configManager: ConfigManager) {
    this.log = log;
    this.configManager = configManager;
    this.register = new Register(this.io);
    this.entitiesCollection = new EntitiesCollection(this.io, this.register);
    this.pluginEnv = new PluginEnv(this.configManager, this.register, this.entitiesCollection);
  }


  async start() {
    this.log.info(`--> Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`--> Resolving and preparing entities`);
    await this.entitiesCollection.generate();
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
