import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import Manager from './Manager';
import Manifests from './Manifests';
import systemPlugin from './systemPlugin';
import HostsConfigGenerator from './HostsConfigGenerator';
import HostsFilesSet from './HostsFilesSet';
import HostsFilesWriter from './HostsFilesWriter';
import PreManifestBase from './interfaces/PreManifestBase';
import {loadManifest} from './IO';


export default class Main {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;
  private readonly hostsFilesSet: HostsFilesSet;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly manager: Manager;


  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;
    this.register = new Register(this);
    this.manifests = new Manifests();
    this.hostsConfigGenerator = new HostsConfigGenerator(this.masterConfig, this.manifests);
    this.hostsFilesSet = new HostsFilesSet(this.manifests, this.hostsConfigGenerator);
    this.hostsFilesWriter = new HostsFilesWriter(this.hostsFilesSet, this.hostsConfigGenerator);
    this.manager = new Manager(this.masterConfig, this.register, this.manifests, this.hostsConfigGenerator);
  }

  async start() {
    // registering of plugins, devices, drivers and services
    await this.registering();

    // resolve and prepare manifests
    await this.manifests.generate(
      this.register.getDevicesPreManifests(),
      this.register.getDriversPreManifests(),
      this.register.getServicesPreManifests()
    );

    // generate hosts configs
    this.hostsConfigGenerator.generate();

    // call handlers after init
    this.manager.$riseAfterInit();

    this.hostsFilesSet.collect();
    await this.hostsFilesWriter.writeToStorage();
  }


  async $loadManifest<T extends PreManifestBase>(resolvedPathToManifest: string): Promise<T> {
    // TODO: move from helpers
    return await loadManifest<T>(resolvedPathToManifest);
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

}
