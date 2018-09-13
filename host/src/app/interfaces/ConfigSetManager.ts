import {ManifestsTypePluralName} from '../../../../configWorks/Entities';
import ManifestBase from './ManifestBase';


export default interface ConfigSetManager {
  loadConfig<T>(configFileName: string): Promise<T>;
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T>;
  loadEntityClass<T>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T>;
  loadEntityFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string>;
}
