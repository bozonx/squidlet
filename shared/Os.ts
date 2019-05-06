import * as path from 'path';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as rimraf from 'rimraf';
import * as yaml from 'js-yaml';
import * as childProcess from 'child_process';
import {ChildProcess} from 'child_process';

import systemConfig from '../hostEnvBuilder/configs/systemConfig';
import {Stats} from '../system/interfaces/io/StorageIo';
import {callPromised} from '../system/helpers/helpers';


export interface SpawnCmdResult {
  stdout: string[];
  stderr: string[];
  status: number;
}


export default class Os {
  getFileContent(pathTo: string): Promise<string> {
    return callPromised(fs.readFile, pathTo, systemConfig.filesEncode) as Promise<string>;
  }

  async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
    const yamlContent: string = await this.getFileContent(fullPath);

    return yaml.safeLoad(yamlContent);
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

  readlink(pathTo: string): Promise<string> {
    return callPromised(fs.readlink, pathTo);
  }

  symlink(from: string, to: string): Promise<void> {
    return callPromised(fs.symlink, from, to);
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
  }

  async rimraf(pathTo: string) {
    return new Promise((resolve, reject) => {
      rimraf(pathTo, (err: Error) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  /**
   * Spawn command via /bin/bash and wait while it will be finished.
   * It don't write to console by itself, it just returns a complete result.
   * @param {string} cmd - your command
   * @param {string} cwd - working dir. Optional.
   * @return {Promise} with {stdout: String, stderr: String, status: Number}
   */
  spawnCmd(cmd: string, cwd?: string): Promise<SpawnCmdResult> {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const options = {
      cwd,
      shell: '/bin/bash',
      encoding: 'utf8',
    };
    const spawnedCmd: ChildProcess | null = childProcess.spawn(cmd, options);

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
