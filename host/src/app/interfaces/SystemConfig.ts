export default interface SystemConfig {
  rootDirs: {
    host: string;
    devices: string;
    services: string;
    data: string;
  };
  deviceIdSeparator: string;
  deviceHostSeparator: string;
  topicSeparator: string;
  eventNameSeparator: string;
}
