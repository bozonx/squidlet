import {ManifestsTypePluralName} from './ManifestTypes';
import ManifestBase from './ManifestBase';
import {EntityClassType} from '../entities/EntityManagerBase';


export default interface SysFsDriver {
  getHostHashes(): Promise<{[index: string]: any}>;
  getConfigsHashes(): Promise<{[index: string]: any}>;
  getEntitiesHashes(): Promise<{[index: string]: any}>;
  loadConfig(configName: string): Promise<{[index: string]: any}>;
  loadEntityManifest(pluralType: ManifestsTypePluralName, entityName: string): Promise<ManifestBase>;
  loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType>;
  loadEntityFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string>;
  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array>;
  writeHostFile(fileName: string, content: string): Promise<void>;
  writeConfigFile(fileName: string, content: string): Promise<void>;
  writeEntityFile(fileName: string, content: string): Promise<void>;
  writeHostHashesFile(content: string): Promise<void>;
  writeConfigHashesFile(content: string): Promise<void>;
  removeHostFiles(filesList: string[]): Promise<void>;
  removeEntitiesFiles(filesList: string[]): Promise<void>;
}
