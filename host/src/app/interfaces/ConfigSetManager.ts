import System from '../System';


export default interface ConfigSetManager {
  init(system: System): void;
  loadConfig(configName: string): Promise<any>;
  loadManifest<T>(typeDir: string, entityDir: string) : Promise<T>;
  loadEntityClass<T>(typeDir: string, entityDir: string) : Promise<T>;
  loadEntityFile(entityType: string, entityName: string, fileName: string): Promise<string>;
}
