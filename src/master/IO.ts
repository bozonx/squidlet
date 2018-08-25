import * as fs from 'fs';
import { yamlToJs } from '../helpers/helpers';

import * as uniqid from 'uniqid';
import * as path from 'path';
import PreManifestBase from './interfaces/PreManifestBase';


export const INDEX_MANIFEST_FILE_NAMES = ['manifest'];


// TODO: move to class
export async function loadManifest<T extends PreManifestBase>(pathToDirOrFile: string): Promise<T> {
  if (pathToDirOrFile.indexOf('/') !== 0) {
    throw new Error(`You have to specify an absolute path of "${pathToDirOrFile}"`);
  }

  const resolvedPathToManifest: string = await resolveFile(pathToDirOrFile, 'yaml', INDEX_MANIFEST_FILE_NAMES);

  const parsedManifest: T = (await loadYamlFile(resolvedPathToManifest)) as T;

  parsedManifest.baseDir = path.dirname(resolvedPathToManifest);

  return parsedManifest;
}

export async function resolveFile(pathToDirOrDile: string, ext: string, indexFileName: string[]): string {
  // TODO: если это папка - то смотреть manifest.yaml / device.yaml | driver.yaml | service.yaml
  // TODO: расширение yaml - можно подставлять - необязательно указывать
}

export async function loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
  const yamlContent: string = await getFileContent(fullPath);

  return yamlToJs(yamlContent);
}

export function getFileContent(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err: NodeJS.ErrnoException, data: string) => {
      if (err) return reject(err);

      resolve(data);
    });
  });
}

export function generateUniqId(): string {
  return uniqid();
}

  // loadYamlFileSync(fullPath: string): object {
  //   const yamlContent = fs.readFileSync(fullPath, 'utf8');
  //
  //   return yamlToJs(yamlContent);
  // }
