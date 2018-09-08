export default interface ConfigSet {
  loadConfig(configName: string): Promise<any>;
}
