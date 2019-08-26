import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as rimraf from 'rimraf';
import * as yaml from 'js-yaml';
import * as childProcess from 'child_process';
import {ChildProcess} from 'child_process';

import {Stats} from '../system/interfaces/io/StorageIo';
import {callPromised} from '../system/lib/helpers';
import {ENCODE} from '../system/constants';


export interface SpawnCmdResult {
  stdout: string[];
  stderr: string[];
  status: number;
}

export interface OwnerOptions {
  uid?: number;
  gid?: number;
}


export default class Os {
  getFileContent(pathTo: string): Promise<string> {
    return callPromised(fs.readFile, pathTo, ENCODE) as Promise<string>;
  }

  async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
    const yamlContent: string = await this.getFileContent(fullPath);

    return yaml.safeLoad(yamlContent);
  }

  async writeFile(pathTo: string, data: string | Uint8Array, options?: OwnerOptions): Promise<void> {
    if (typeof data === 'string') {
      await callPromised(fs.writeFile, pathTo, data, ENCODE);
    }
    else {
      await callPromised(fs.writeFile, pathTo, data);
    }

    if (!options) return;

    await this.chown(pathTo, options.uid, options.gid);
  }

  async copyFile(src: string, dest: string): Promise<void> {
    return callPromised(fs.copyFile, src, dest);
    // TODO: use chown
  }

  mkdir(pathTo: string, options?: OwnerOptions): Promise<void> {
    return callPromised(fs.mkdir, pathTo);
    // TODO: use chown
  }

  async mkdirP(dirName: string, options?: OwnerOptions): Promise<void> {
    shelljs.mkdir('-p', dirName);
    // TODO: use chown
  }

  chown(pathTo: string, uid?: number, gid?: number): Promise<void> {
    // TODO: use extended logic
    return callPromised(fs.chown, pathTo, uid, gid);
  }

  readdir(pathTo: string): Promise<string[]> {
    return callPromised(fs.readdir, pathTo, ENCODE) as Promise<string[]>;
  }

  readlink(pathTo: string): Promise<string> {
    return callPromised(fs.readlink, pathTo);
  }

  symlink(from: string, to: string): Promise<void> {
    return callPromised(fs.symlink, from, to);
    // TODO: use chown
  }

  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  async stat(pathTo: string): Promise<Stats> {
    const stat = await callPromised(fs.lstat, pathTo);

    return {
      size: stat.size,
      dir: stat.isDirectory(),
      symbolicLink: stat.isSymbolicLink(),
      mtime: stat.mtime.getTime(),
    };
  }

  async writeJson(fileName: string, contentJs: any) {
    const content = JSON.stringify(contentJs);

    await this.mkdirP(path.dirname(fileName));
    await this.writeFile(fileName, content);
    // TODO: use chown
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
