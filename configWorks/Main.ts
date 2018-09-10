import * as path from 'path';

import PreMasterConfig from './interfaces/PreMasterConfig';
import PreManifestBase from './interfaces/PreManifestBase';
import Register from './Register';
import PluginEnv from './PluginEnv';
import Entities from './Entities';
import MasterConfig from './MasterConfig';
import HostsConfigsSet from './HostsConfigsSet';
import Definitions from './Definitions';
import HostsFilesSet from './HostsFilesSet';
import systemPlugin from './systemPlugin';
import * as Io from './IO';
import systemConfig from './configs/systemConfig';
import * as defaultLogger from './defaultLogger';
import {resolveIndexFile} from './helpers';
import HostsFilesWriter from './HostsFilesWriter';


export default class Main {
  readonly masterConfig: MasterConfig;
  readonly register: Register;
  readonly entities: Entities;
  readonly hostsConfigSet: HostsConfigsSet;
  readonly definitions: Definitions;
  readonly hostsFilesSet: HostsFilesSet;
  readonly hostsFilesWriter: HostsFilesWriter;
  readonly log = defaultLogger;
  readonly io = Io;
  private readonly pluginEnv: PluginEnv;


  constructor(masterConfig: PreMasterConfig, masterConfigPath: string) {
    this.masterConfig = new MasterConfig(this, masterConfig, masterConfigPath);
    this.register = new Register(this);
    this.entities = new Entities(this);
    this.hostsConfigSet = new HostsConfigsSet(this);
    this.definitions = new Definitions(this);
    this.hostsFilesSet = new HostsFilesSet(this);
    this.hostsFilesWriter = new HostsFilesWriter(this);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.entities, this.hostsConfigSet);
  }

  async collect() {
    this.log.info(`Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`Resolving and preparing entities`);
    await this.entities.generate();

    this.log.info(`Generating hosts configs`);
    this.hostsConfigSet.generate();
    this.log.info(`Generating hosts entities definitions`);
    this.definitions.generate();

    this.log.info(`Initialization has finished`);
    // call handlers after init
    this.pluginEnv.$riseAfterInit();

    this.log.info(`Collecting files set`);
    this.hostsFilesSet.collect();
  }

  /**
   * Write all the hosts and entities files to storage
   */
  async writeAll() {
    this.log.info(`Write hosts files`);
    await this.hostsFilesWriter.writeToStorage();
  }

  async generateMasterSet() {
    // TODO: !!!!
  }


  // TODO: похоже используется только в Register - перенести туда
  async $loadManifest<T extends PreManifestBase>(pathToDirOrFile: string): Promise<T> {
    if (pathToDirOrFile.indexOf('/') !== 0) {
      throw new Error(`You have to specify an absolute path of "${pathToDirOrFile}"`);
    }

    const resolvedPathToManifest: string = await resolveIndexFile(
      pathToDirOrFile,
      systemConfig.indexManifestFileNames
    );
    const parsedManifest = (await this.io.loadYamlFile(resolvedPathToManifest)) as T;

    parsedManifest.baseDir = path.dirname(resolvedPathToManifest);

    return parsedManifest;
  }

  // TODO: похоже используется только в Register - перенести туда
  // it needs for test purpose
  $require(devicePath: string) {
    return require(devicePath);
  }

  async $writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.io.mkdirP(path.dirname(fileName));
    await this.io.writeFile(fileName, content);
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
