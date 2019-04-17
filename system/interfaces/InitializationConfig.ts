export default interface InitializationConfig {
  fileNames: {
    hostConfig: string;
    manifest: string;
    //mainJs: string;

    systemDrivers: string;
    regularDrivers: string;

    systemServices: string;
    regularServices: string;

    devicesDefinitions: string;
    driversDefinitions: string;
    servicesDefinitions: string;
    devsDefinitions: string;
  };
}
