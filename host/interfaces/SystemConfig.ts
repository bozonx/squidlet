export default interface SystemConfig {
  rootDirs: {
    host: string;
    configs: string;
    entities: string;
    // devices: string;
    // services: string;
    // data: string;
  };
  storageDirs: {
    common: string;
    cache: string;
    logs: string;
  };
  // hashFiles: {
  //   host: string;
  //   configs: string;
  //   entities: string;
  // };
  // entitiesDirs: {
  //   devices: string;
  //   drivers: string;
  //   services: string;
  // };
  deviceIdSeparator: string;
  topicSeparator: string;
  eventNameSeparator: string;
}
