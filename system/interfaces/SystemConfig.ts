export default interface SystemConfig {
  envSetDirs: {
    system: string;
    configs: string;
    entities: string;
    devs: string;
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
