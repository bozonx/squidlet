export default interface ConfigSetManager {
  loadConfig(configName: string): Promise<any>;
}
