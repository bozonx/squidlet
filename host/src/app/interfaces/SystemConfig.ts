export default interface SystemConfig {
  rootDirs: {
    host: string;
    devices: string;
    services: string;
    data: string;
  };
  deviceIdSeparator: string;
  topicSeparator: string;
  eventNameSeparator: string;
}
