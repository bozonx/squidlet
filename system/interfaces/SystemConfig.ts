export default interface SystemConfig {
  rootDirs: {
    // path to host's configs and entities
    envSet: string;
    // path to host's various data dir. It can be absolute or relative of master config file
    varData: string;
    // path to tmp dir
    tmp: string;
  };
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
