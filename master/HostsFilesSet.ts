import HostConfig from '../host/src/app/interfaces/HostConfig';
import DriverManifest from '../host/src/app/interfaces/DriverManifest';
import DeviceManifest from '../host/src/app/interfaces/DeviceManifest';
import ServiceManifest from '../host/src/app/interfaces/ServiceManifest';
import Manifests, {Dependencies, ManifestsTypePluralName} from './Manifests';
import HostsConfigGenerator from './HostsConfigGenerator';
import DeviceDefinition from '../host/src/app/interfaces/DeviceDefinition';
import DriverDefinition from '../host/src/app/interfaces/DriverDefinition';
import ServiceDefinition from '../host/src/app/interfaces/ServiceDefinition';
import HostFilesSet from './interfaces/HostFilesSet';


export default class HostsFilesSet {
  private readonly manifests: Manifests;
  private readonly hostsConfigGenerator: HostsConfigGenerator;
  // file sets by hostId
  private files: {[index: string]: HostFilesSet} = {};

  constructor(manifests: Manifests, hostsConfigGenerator: HostsConfigGenerator) {
    this.manifests = manifests;
    this.hostsConfigGenerator = hostsConfigGenerator;
  }

  getCollection(): {[index: string]: HostFilesSet} {
    return this.files;
  }

  /**
   * Generate file set for each host
   */
  collect() {
    const hostsConfigs: {[index: string]: HostConfig} = this.hostsConfigGenerator.getHostsConfig();

    for (let hostId of Object.keys(hostsConfigs)) {
      const hostConfig: HostConfig = hostsConfigs[hostId];
      const {
        devicesClasses,
        driversClasses,
        servicesClasses,
      } = this.generateClassNames(hostConfig);

      this.files[hostId] = {
        config: hostConfig,
        devicesManifests: this.collectManifests<DeviceManifest>('devices', devicesClasses),
        driversManifests: this.collectManifests<DriverManifest>('drivers', driversClasses),
        servicesManifests: this.collectManifests<ServiceManifest>('services', servicesClasses),
        driversFiles: this.collectFiles('devices', devicesClasses),
        devicesFiles: this.collectFiles('drivers', driversClasses),
        servicesFiles: this.collectFiles('services', servicesClasses),
      };
    }

    //
    // TODO: смержить конфиг платформы
    // TODO: смержить props
    // TODO: добавить connection driver и его зависимые драйверы которые используются в network

  }

  private generateClassNames(hostConfig: HostConfig) {
    const devicesClasses = hostConfig.devices.map((item: DeviceDefinition) => item.className);
    const onlyDriversClasses = hostConfig.drivers.map((item: DriverDefinition) => item.className);
    const servicesClasses = hostConfig.services.map((item: ServiceDefinition) => item.className);
    const driversClasses = this.collectDriverNamesWithDependencies(
      devicesClasses,
      onlyDriversClasses,
      servicesClasses,
    );

    return {
      devicesClasses,
      driversClasses,
      servicesClasses,
    };
  }

  /**
   * Collect of the drivers which are dependencies of devices, drivers or services
   */
  private collectDriverNamesWithDependencies(
    devicesClasses: string[],
    driversClasses: string[],
    servicesClasses: string[]
  ): string[] {
    const dependencies: Dependencies = this.manifests.getDependencies();
    // there is an object for deduplicate purpose
    const depsDriversNames: {[index: string]: true} = {};

    function addDeps(type: ManifestsTypePluralName, classNames: string[]) {
      for (let className of classNames) {
        if (!dependencies[type][className]) return;

        dependencies[type][className]
          .forEach((depDriverName: string) => {
            depsDriversNames[depDriverName] = true;
          });
      }
    }

    // first add all the driver names
    for (let className of driversClasses) {
      depsDriversNames[className] = true;
    }
    // add deps of devices
    addDeps('devices', devicesClasses);
    // add deps of drivers
    addDeps('drivers', driversClasses);
    // add deps of services
    addDeps('services', servicesClasses);

    // TODO: исключить dev или это сделать в manifests ????

    // get only driver class names
    return Object.keys(depsDriversNames);
  }

  /**
   * Collect all the used host manifest of devices, drivers or services
   */
  private collectManifests<T>(manifestType: ManifestsTypePluralName, entityNames: string[]): T[] {
    const manifests = this.manifests.getManifests() as any;
    const manifestsOfType: {[index: string]: T} = manifests[manifestType];

    return entityNames.map((usedEntityName: string) => manifestsOfType[usedEntityName]);
  }

  /**
   * Collect all the used host files of devices, drivers or services
   */
  private collectFiles(
    manifestType: ManifestsTypePluralName,
    entityNames: string[]
  ): {[index: string]: string[]} {
    const files = this.manifests.getFiles()[manifestType];
    // files paths by entity name
    const result: {[index: string]: string[]} = {};

    for (let usedEntityName of entityNames) {
      result[usedEntityName] = files[usedEntityName];
    }

    return result;
  }

}

// private mergeProps(
//   className: string,
//   instanceProps: {[index: string]: any},
// manifestProps?: {[index: string]: any}
// ): {[index: string]: any} {
//   return {
//     // default props from device's manifest
//     ...manifestProps,
//     // default props from config.devicesDefaults
//     ...this.system.host.config.devicesDefaults && this.system.host.config.devicesDefaults[className],
//     // specified props for certain instance
//     ...instanceProps,
//   };
// }
