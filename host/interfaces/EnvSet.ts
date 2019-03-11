import ManifestBase from './ManifestBase';
import {ManifestsTypePluralName} from './ManifestTypes';
import {EntityClassType} from '../entities/EntityManagerBase';

export default interface EnvSet {
  loadConfig<T>(configName: string): Promise<T>;
  loadManifest<T extends ManifestBase>(pluralType: ManifestsTypePluralName, entityName: string) : Promise<T>;
  loadMain<T extends EntityClassType>(pluralType: ManifestsTypePluralName, entityName: string): Promise<T>;
  loadEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<string>;
  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array>;
}
