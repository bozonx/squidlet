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
import {loadYamlFile, resolveFile} from './IO';
import systemConfig from './configs/systemConfig';
import PreHostConfig from './interfaces/PreHostConfig';


export default class Main {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfigSet: HostsConfigsSet;
  private readonly hostsFilesSet: HostsFilesSet;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly pluginEnv: PluginEnv;

  get buildDir(): string {
    if (this.masterConfig.hosts && this.masterConfig.hosts.master.host.storageDir) {
      return this.masterConfig.hosts.master.host.storageDir;
    }

    return systemConfig.defaultDuildDir;
  }

  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = this.prepareMasterConfig(masterConfig);
    this.register = new Register(this);
    this.manifests = new Manifests(this);
    this.hostsConfigSet = new HostsConfigsSet(this);
    this.hostsFilesSet = new HostsFilesSet(this.manifests, this.hostsConfigSet);
    this.hostsFilesWriter = new HostsFilesWriter(this.hostsFilesSet, this.hostsConfigSet);
    this.pluginEnv = new PluginEnv(this.masterConfig, this.register, this.manifests, this.hostsConfigSet);
  }

  async start() {
    // TODO: писать в лог о каждом этапе

    // registering of plugins, devices, drivers and services
    await this.registering();

    // resolve and prepare manifests
    await this.manifests.generate(
      this.register.getDevicesPreManifests(),
      this.register.getDriversPreManifests(),
      this.register.getServicesPreManifests()
    );

    // generate hosts configs
    this.hostsConfigSet.generate();

    // call handlers after init
    this.pluginEnv.$riseAfterInit();

    this.hostsFilesSet.collect();
    await this.hostsFilesWriter.writeToStorage();
  }


  async $loadManifest<T extends PreManifestBase>(pathToDirOrFile: string): Promise<T> {
    if (pathToDirOrFile.indexOf('/') !== 0) {
      throw new Error(`You have to specify an absolute path of "${pathToDirOrFile}"`);
    }

    const resolvedPathToManifest: string = await resolveFile(
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

}
