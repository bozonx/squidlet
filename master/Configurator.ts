import MasterConfig from './interfaces/MasterConfig';
import validateMasterConfig from './validateMasterConfig';
import Register from './Register';
import Manager from './Manager';
import Manifests from './Manifests';
import systemPlugin from './systemPlugin';
import HostsConfigGenerator from './HostsConfigGenerator';
import HostsFiles from './HostsFiles';
import HostsFilesWriter from './HostsFilesWriter';


export default class Configurator {
  private readonly masterConfig: MasterConfig;
  private readonly register: Register;
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;
  private readonly hostsFiles: HostsFiles;
  private readonly hostsFilesWriter: HostsFilesWriter;
  private readonly manager: Manager;


  constructor(masterConfig: {[index: string]: any}) {
    const validateError: string | undefined = validateMasterConfig(masterConfig);

    if (validateError) throw new Error(`Invalid master config: ${validateError}`);

    this.masterConfig = masterConfig as MasterConfig;
    this.register = new Register();
    this.manifests = new Manifests();
    this.hostsConfigGenerator = new HostsConfigGenerator(this.masterConfig, this.manifests);
    this.hostsFiles = new HostsFiles(this.manifests, this.hostsConfigGenerator);
    this.hostsFilesWriter = new HostsFilesWriter(this.manifests, this.hostsConfigGenerator);
    this.manager = new Manager(this.masterConfig, this.register, this.manifests, this.hostsConfigGenerator);
  }

  async start() {
    await this.registering();

    // resolve and prepare manifest
    await this.manifests.generate(
      this.register.getDevicesPreManifests(),
      this.register.getDriversPreManifests(),
      this.register.getServicesPreManifests()
    );

    // generate hosts configs
    this.hostsConfigGenerator.generate();

    // call handlers after init
    this.manager.$riseAfterInit();

    this.hostsFiles.generate();
    await this.hostsFilesWriter.writeToStorage();
  }

  private async registering() {
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
    await Promise.all(this.register.getRegisterPromises());
  }

}
