import * as path from 'path';
import * as fs from 'fs';
import {promises as fsPromises} from 'fs';
import * as shelljs from 'shelljs';
import * as yaml from 'js-yaml';
import * as rimraf from 'rimraf';

import systemConfig from './configs/systemConfig';
import {Stats} from '../host/interfaces/dev/StorageDev';
import * as rimraf from './entities/EntitiesWriter';


export default class Io {
  async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
    const yamlContent: string = await this.getFileContent(fullPath);

    return this.yamlToJs(yamlContent);
  }

  getFileContent(path: string): Promise<string> {
    return fsPromises.readFile(path, systemConfig.filesEncode) as Promise<string>;
  }

  async writeFile(path: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return fsPromises.writeFile(path, data, systemConfig.filesEncode);
    }
    else {
      return fsPromises.writeFile(path, data);
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    return fsPromises.copyFile(src, dest);
  }

  async renameFile(src: string, dest: string): Promise<void> {
    return fsPromises.rename(src, dest);
  }

  mkdir(path: string): Promise<void> {
    return fsPromises.mkdir(path);
  }

  async mkdirP(dirName: string): Promise<void> {
    shelljs.mkdir('-p', dirName);
  }

  yamlToJs(yamlString: string): any {
    return yaml.safeLoad(yamlString);
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  async stat(path: string): Promise<Stats> {
    const stat = await fsPromises.stat(path);

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      mtime: stat.mtimeMs,
    };
  }

  async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.mkdirP(path.dirname(fileName));
    await this.writeFile(fileName, content);
  }

  async rimraf(pathTo: string) {
    return new Promise((resolve, reject) => {
      rimraf(pathTo, (err: Error) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

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
