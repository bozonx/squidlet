export default interface InitializationConfig {
  hostDirs: {
    config: string;
    devices: string;
    drivers: string;
    services: string;
  };
  fileNames: {
    hostConfig: string;
    manifest: string;
    mainJs: string;

    systemDrivers: string;
    regularDrivers: string;

    systemServices: string;
    regularServices: string;

    devicesDefinitions: string;
    driversDefinitions: string;
    servicesDefinitions: string;
  };
}
