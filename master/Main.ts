import * as path from 'path';

import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import Manager from './Manager';
import Manifests from './Manifests';
import systemPlugin from './systemPlugin';
import HostsConfigsSet from './HostsConfigsSet';
import HostsFilesSet from './HostsFilesSet';
import HostsFilesWriter from './HostsFilesWriter';
import PreManifestBase from './interfaces/PreManifestBase';
import {loadYamlFile, resolveFile} from './IO';
import systemConfig from './configs/systemConfig';


export default class Main {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfigSet: HostsConfigsSet;
  private readonly hostsFilesSet: HostsFilesSet;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly manager: Manager;

  get buildDir(): string {

    // TODO: !!!! use host's storageDir

    return this.masterConfig.buildDir as string;
  }

  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;
    this.register = new Register(this);
    this.manifests = new Manifests(this);
    this.hostsConfigSet = new HostsConfigsSet(this.masterConfig, this.manifests);
    this.hostsFilesSet = new HostsFilesSet(this.manifests, this.hostsConfigSet);
    this.hostsFilesWriter = new HostsFilesWriter(this.hostsFilesSet, this.hostsConfigSet);
    this.manager = new Manager(this.masterConfig, this.register, this.manifests, this.hostsConfigSet);
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
    this.manager.$riseAfterInit();

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
    await this.register.initPlugins(this.manager);
    // wait for all the registering processes. It needs if plugin doesn't wait for register promise.
    await Promise.all(this.register.getRegisteringPromises());
  }


  // private prepareMasterConfig(preMasterConfig: {[index: string]: any}): MasterConfig {
  //   return {
  //     ...preMasterConfig,
  //     ...masterConfigDefaults,
  //   } as MasterConfig;
  // }

}
