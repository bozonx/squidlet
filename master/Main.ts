import * as path from 'path';
const _omit = require('lodash/omit');

import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import PluginEnv from './PluginEnv';
import Manifests from './Manifests';
import systemPlugin from './systemPlugin';
import HostsConfigsSet from './HostsConfigsSet';
import HostsFilesSet from './HostsFilesSet';
import HostsFilesWriter from './HostsFilesWriter';
import PreManifestBase from './interfaces/PreManifestBase';
import {exists, loadYamlFile, stat} from './IO';
import systemConfig from './configs/systemConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import * as defaultLogger from './defaultLogger';


export default class Main {
  readonly masterConfig: MasterConfig;
  readonly manifests: Manifests;
  readonly hostsFilesSet: HostsFilesSet;
  readonly buildDir: string;
  readonly log = defaultLogger;
  private readonly hostsConfigSet: HostsConfigsSet;
  private readonly register: Register;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly pluginEnv: PluginEnv;

  get masterConfigHosts(): {[index: string]: PreHostConfig} {
    return this.masterConfig.hosts as {[index: string]: PreHostConfig};
  }

  constructor(masterConfig: {[index: string]: any}, masterConfigPath: string) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = this.prepareMasterConfig(masterConfig);
    this.buildDir = this.makeBuildDir(masterConfigPath);
    this.register = new Register(this);
    this.manifests = new Manifests(this);
    this.hostsConfigSet = new HostsConfigsSet(this);
    this.hostsFilesSet = new HostsFilesSet(this.manifests, this.hostsConfigSet);
    this.hostsFilesWriter = new HostsFilesWriter(this);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.manifests, this.hostsConfigSet);
  }

  async start() {
    this.log.info(`Registering plugins, devices, drivers and services`);
    await this.registering();

    this.log.info(`Resolving and preparing manifests`);
    await this.manifests.generate(
      this.register.getDevicesPreManifests(),
      this.register.getDriversPreManifests(),
      this.register.getServicesPreManifests()
    );

    this.log.info(`Generating hosts configs`);
    this.hostsConfigSet.generate();

    this.log.info(`Initialization has finished`);
    // call handlers after init
    this.pluginEnv.$riseAfterInit();

    this.log.info(`Collecting files set`);
    this.hostsFilesSet.collect();
    this.log.info(`Write hosts files`);
    await this.hostsFilesWriter.writeToStorage();

    this.log.info(`Done!`);
  }


  async $loadManifest<T extends PreManifestBase>(pathToDirOrFile: string): Promise<T> {
    if (pathToDirOrFile.indexOf('/') !== 0) {
      throw new Error(`You have to specify an absolute path of "${pathToDirOrFile}"`);
    }

    const resolvedPathToManifest: string = await this.resolveIndexFile(
      pathToDirOrFile,
      systemConfig.indexManifestFileNames
    );
    const parsedManifest = (await loadYamlFile(resolvedPathToManifest)) as T;

    parsedManifest.baseDir = path.dirname(resolvedPathToManifest);

    return parsedManifest;
  }

  // it needs for test purpose
  $require(devicePath: string) {
    return require(devicePath);
  }

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

  private prepareMasterConfig(preMasterConfig: {[index: string]: any}): MasterConfig {
    let hosts: {[index: string]: PreHostConfig} = {};

    if (this.masterConfig.hosts) {
      hosts = this.masterConfig.hosts;
    }
    else if (this.masterConfig.host) {
      hosts = {
        master: this.masterConfig.host,
      };
    }

    return {
      ..._omit(preMasterConfig, 'host', 'hosts'),
      hosts
    };
  }

  private makeBuildDir(masterConfigPath: string): string {
    if (this.masterConfig.hosts && this.masterConfig.hosts.master.host.storageDir) {
      // use master's storage dir
      const storageDir = this.masterConfig.hosts.master.host.storageDir;

      if (path.isAbsolute(masterConfigPath)) {
        // it's an absolute path
        return storageDir;
      }
      else {
        // relative path - make it relative to config file
        return path.join(path.dirname(masterConfigPath), storageDir);
      }
    }

    // use default build dir
    return systemConfig.defaultDuildDir;
  }

  private async resolveIndexFile(pathToDirOrFile: string, indexFileNames: string[]): Promise<string> {
    if (!(await stat(pathToDirOrFile)).dir) {
      // if it's file - return it
      return pathToDirOrFile;
    }
    // else is dir

    for (let indexFile of indexFileNames) {
      const fullPath = path.join(pathToDirOrFile, indexFile);

      if (exists(fullPath)) {
        return fullPath;
      }
    }

    throw new Error(`Can't resolve index file "${pathToDirOrFile}"`);
  }

}
