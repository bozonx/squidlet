import * as path from 'path';
import * as fs from 'fs';
import {Stats} from 'fs';
import * as shelljs from 'shelljs';
import rimraf from 'rimraf';
import yaml from 'js-yaml';
import * as childProcess from 'child_process';
import {ChildProcess} from 'child_process';

import {StatsSimplified} from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import {callPromised} from '../../../../squidlet-lib/src/common';
import {ENCODE} from '../../../../squidlet-lib/src/constants';
import {OwnerOptions} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/interfaces/OnwerOptions.js';


export interface SpawnCmdResult {
  stdout: string[];
  stderr: string[];
  status: number;
}


export default class Os {
  getFileContent(pathTo: string): Promise<string> {
    return callPromised(fs.readFile, pathTo, ENCODE) as Promise<string>;
  }

  async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
    const yamlContent: string = await this.getFileContent(fullPath);

    return yaml.safeLoad(yamlContent) as any;
  }

  async writeFile(pathTo: string, data: string | Uint8Array, options?: OwnerOptions): Promise<void> {
    if (typeof data === 'string') {
      await callPromised(fs.writeFile, pathTo, data, ENCODE);
    }
    else {
      await callPromised(fs.writeFile, pathTo, data);
    }

    if (options) await this.chown(pathTo, options.uid, options.gid);
  }

  async copyFile(src: string, dest: string, options?: OwnerOptions): Promise<void> {
    await callPromised(fs.copyFile, src, dest);

    if (options) await this.chown(dest, options.uid, options.gid);
  }

  async mkdir(pathTo: string, options?: OwnerOptions): Promise<void> {
    await callPromised(fs.mkdir, pathTo);

    if (options) await this.chown(pathTo, options.uid, options.gid);
  }

  async mkdirP(dirName: string, options?: OwnerOptions): Promise<void> {
    shelljs.mkdir('-p', dirName);

    if (options) await this.chown(dirName, options.uid, options.gid);
  }

  async chown(pathTo: string, uid?: number, gid?: number): Promise<void> {
    if (typeof uid === 'undefined' && typeof gid === 'undefined') {
      // noting to change - just return
      return;
    }
    else if (typeof uid !== 'undefined' && typeof gid !== 'undefined') {
      // uid and gid are specified - set both
      return await callPromised(fs.chown, pathTo, uid, gid);
    }

    // else load stats to resolve lack of params

    const stat: Stats = await callPromised(fs.lstat, pathTo);

    await callPromised(
      fs.chown,
      pathTo,
      (typeof uid === 'undefined') ? stat.uid : uid,
      (typeof gid === 'undefined') ? stat.gid : gid,
    );
  }

  readdir(pathTo: string): Promise<string[]> {
    return callPromised(fs.readdir, pathTo, ENCODE) as Promise<string[]>;
  }

  readlink(pathTo: string): Promise<string> {
    return callPromised(fs.readlink, pathTo);
  }

  async symlink(from: string, to: string, options?: OwnerOptions): Promise<void> {
    await callPromised(fs.symlink, from, to);

    if (options) await this.chown(to, options.uid, options.gid);
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  async stat(pathTo: string): Promise<StatsSimplified> {
    const stat = await callPromised(fs.lstat, pathTo);

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      symbolicLink: stat.isSymbolicLink(),
      mtime: stat.mtime.getTime(),
    };
  }

  async writeJson(fileName: string, contentJs: any, options?: OwnerOptions) {
    const content = JSON.stringify(contentJs);

    await this.mkdirP(path.dirname(fileName));
    await this.writeFile(fileName, content);

    if (options) await this.chown(fileName, options.uid, options.gid);
  }

  async rimraf(pathTo: string) {
    return new Promise((resolve, reject) => {
      rimraf(pathTo, (err: Error) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  processExit(code: number) {
    process.exit(code);
  }

  require(pathToModule: string): any {
    return require(pathToModule);
  }

  /**
   * Spawn command via /bin/bash and wait while it will be finished.
   * It don't write to console by itself, it just returns a complete result.
   * @param {string} cmd - your command
   * @param {string} cwd - working dir. Optional.
   * @param options
   * @return {Promise} with {stdout: String, stderr: String, status: Number}
   */
  spawnCmd(cmd: string, cwd?: string, options?: OwnerOptions): Promise<SpawnCmdResult> {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const completedOptions = {
      cwd,
      shell: '/bin/bash',
      encoding: ENCODE,
      ...options,
    };
    const spawnedCmd: ChildProcess | null = childProcess.spawn(cmd, completedOptions);

    if (!spawnedCmd) {
      throw new Error(`Can't spawn a process: "${cmd}"`);
    }
    else if (!spawnedCmd.stdout) {
      throw new Error(`No stdout of process: "${cmd}"`);
    }
    else if (!spawnedCmd.stderr) {
      throw new Error(`No stderr of process: "${cmd}"`);
    }

    spawnedCmd.stdout.on('data', (data) => stdout.push(data));
    spawnedCmd.stderr.on('data', (err) => stderr.push(err));

    return new Promise((resolve) => {
      spawnedCmd.on('close', (code) => {
        const result = {
          stdout: stdout,
          stderr: stderr,
          status: code,
        };

        resolve(result);
      });
    });
  }

}
