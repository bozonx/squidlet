import {promises as fsPromises} from 'fs';
import * as uniqid from 'uniqid';
import * as yaml from 'js-yaml';
import systemConfig from './configs/systemConfig';


export async function resolveFile(pathToDirOrFile: string, indexFileNames: string[]): string {
  // TODO: если это папка - то смотреть manifest.yaml / device.yaml | driver.yaml | service.yaml
  // TODO: расширение yaml - можно подставлять - необязательно указывать
}

export async function loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
  const yamlContent: string = await getFileContent(fullPath);

  return yamlToJs(yamlContent);
}

export function getFileContent(path: string): Promise<string> {
  return fsPromises.readFile(path, systemConfig.filesEncode) as Promise<string>;
}

export async function writeFile(path: string, data: string | Uint8Array): Promise<void> {
  if (typeof data === 'string') {
    return fsPromises.writeFile(path, data, systemConfig.filesEncode);
  }
  else {
    return fsPromises.writeFile(path, data);
  }
}

export async function copyFile(src: string, dest: string): Promise<void> {
  return fsPromises.copyFile(src, dest);
}

export async function mkdirP(dirName: string) {
  // TODO: !!!! use logic of mkdirP

  return fsPromises.mkdir(dirName);
}

export function generateUniqId(): string {
  return uniqid();
}

export function yamlToJs(yamlString: string): any {
  return yaml.safeLoad(yamlString);
}


// loadYamlFileSync(fullPath: string): object {
//   const yamlContent = fs.readFileSync(fullPath, 'utf8');
//
//   return yamlToJs(yamlContent);
// }

// /**
//  * Configure master to slaves connections.
//  */
// private configureMasterConnections() {
//
//   // TODO: use host config - там плоская структура
//
//   // findRecursively(this.system.host.config.devices, (item, itemPath): boolean => {
//   //   if (!_.isPlainObject(item)) return false;
//   //   // go deeper
//   //   if (!item.device) return undefined;
//   //   if (item.device !== 'host') return false;
//   //
//   //   const connection = {
//   //     host: itemPath,
//   //     type: item.address.type,
//   //     //bus: item.address.bus,
//   //     bus: (_.isUndefined(item.address.bus)) ? undefined : String(item.address.bus),
//   //     address: item.address.address,
//   //   };
//   //
//   //   this.registerConnection(connection);
//   //
//   //   return false;
//   // });
// }
