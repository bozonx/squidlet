import * as fs from 'fs';
import {promises as fsPromises} from 'fs';
import * as yaml from 'js-yaml';
import systemConfig from '../master/configs/systemConfig';
import mkdirPLogic from '../host/src/helpers/mkdirPLogic';
import {Stats} from '../host/src/app/interfaces/dev/Fs.dev';


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

export function mkdir(path: string): Promise<void> {
  return fsPromises.mkdir(path);
}

export async function mkdirP(dirName: string): Promise<boolean> {
  return mkdirPLogic(dirName, exists, mkdir);
}

export function yamlToJs(yamlString: string): any {
  return yaml.safeLoad(yamlString);
}

export async function exists(path: string): Promise<boolean> {
  return fs.existsSync(path);
}

export async function stat(path: string): Promise<Stats> {
  const stat = await fsPromises.stat(path);

  return {
    size: stat.size,
    dir: stat.isDirectory(),
    mtime: stat.mtimeMs,
  };
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
