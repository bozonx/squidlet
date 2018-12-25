import {ManifestsTypePluralName} from '../ManifestTypes';
import {EntityClassType} from '../../entities/EntityManagerBase';

export default interface Sys {
  loadHashFile(hashName: string): Promise<{[index: string]: any}>;
  loadConfigFile(configName: string): Promise<{[index: string]: any}>;
  loadEntityManifest(pluralType: ManifestsTypePluralName, entityName: string): Promise<{[index: string]: any}>;
  loadEntityMain(pluralType: ManifestsTypePluralName, entityName: string,): Promise<EntityClassType>;
  loadEntityFile(pluralType: ManifestsTypePluralName, entityName: string, fileName: string): Promise<string>;
  loadEntityBinFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string
  ): Promise<Uint8Array>;
  writeHashFile(hashName: string, content: string): Promise<void>;
  writeHostFile(fileName: string, content: string): Promise<void>;
  writeConfig(configName: string, content: string): Promise<void>;
  writeEntityFile(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    fileName: string,
    content: string | Uint8Array
  ): Promise<void>;
  removeHostFiles(filesList: string[]): Promise<void>;
  removeEntityFiles(
    pluralType: ManifestsTypePluralName,
    entityName: string,
    filesList: string[]
  ): Promise<void>;

  // mkdir(fileName: string): Promise<void>;
  // readdir(dirName: string): Promise<string[]>;
  // readJsonObjectFile(fileName: string): Promise<{[index: string]: any}>
  // readStringFile(fileName: string): Promise<string>;
  // readBinFile(fileName: string): Promise<Uint8Array>;
  // requireFile(fileName: string): Promise<any>;
  // rmdir(dirName: string): Promise<void>;
  // unlink(fileName: string): Promise<void>;
  // writeFile(fileName: string, data: string | Uint8Array): Promise<void>;
  // exists(fileOrDirName: string): Promise<boolean>;
}
