import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as rimraf from 'rimraf';
import * as yaml from 'js-yaml';

import systemConfig from '../hostEnvBuilder/configs/systemConfig';
import {Stats} from '../system/interfaces/dev/StorageDev';
import {callPromised} from '../system/helpers/helpers';


export default class Io {
  async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
    const yamlContent: string = await this.getFileContent(fullPath);

    return yaml.safeLoad(yamlContent);
  }

  getFileContent(pathTo: string): Promise<string> {
    return callPromised(fs.readFile, pathTo, systemConfig.filesEncode) as Promise<string>;
  }

  async writeFile(pathTo: string, data: string | Uint8Array): Promise<void> {
    if (typeof data === 'string') {
      return callPromised(fs.writeFile, pathTo, data, systemConfig.filesEncode);
    }
    else {
      return callPromised(fs.writeFile, pathTo, data);
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    return callPromised(fs.copyFile, src, dest);
  }

  mkdir(pathTo: string): Promise<void> {
    return callPromised(fs.mkdir, pathTo);
  }

  async mkdirP(dirName: string): Promise<void> {
    shelljs.mkdir('-p', dirName);
  }

  readdir(pathTo: string): Promise<string[]> {
    return callPromised(fs.readdir, pathTo, systemConfig.filesEncode) as Promise<string[]>;
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  async stat(pathTo: string): Promise<Stats> {
    const stat = await callPromised(fs.stat, pathTo);

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


// async renameFile(src: string, dest: string): Promise<void> {
//   return callPromised(fs.rename, oldPath, newPath);
// }

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
