import _trim = require('lodash/trim');
import * as path from 'path';

import Io, {SpawnCmdResult} from '../../shared/Io';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../shared/GroupConfigParser';
import {HOST_ENVSET_DIR, HOST_TMP_DIR, HOST_VAR_DATA_DIR, HOSTS_WORK_DIRS} from '../../shared/constants';
import {resolveSquidletRoot} from '../../shared/helpers';
import NodejsMachines, {nodejsSupportedMachines} from '../interfaces/NodejsMachines';


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  tmpDir: string = '';
  platform: Platforms = 'nodejs';
  hostId: string = '';
  get hostConfig(): PreHostConfig {
    return this._hostConfig as any;
  }
  get machine(): NodejsMachines {
    return this._machine as any;
  }

  private readonly io: Io;
  private readonly argMachine?: NodejsMachines;
  private readonly argHostName?: string;
  private readonly argWorkDir?: string;
  private readonly groupConfig: GroupConfigParser;
  private _hostConfig?: PreHostConfig;
  private _machine?: NodejsMachines;


  constructor(io: Io, groupConfig: GroupConfigParser, argMachine?: NodejsMachines, argHostName?: string, argWorkDir?: string) {
    this.io = io;
    this.groupConfig = groupConfig;
    this.argMachine = argMachine;
    this.argHostName = argHostName;
    this.argWorkDir = argWorkDir;
  }


  async resolve() {
    this._machine = await this.resolveMachine();
    this._hostConfig = this.groupConfig.getHostConfig(this.argHostName);

    this.validate();

    this.hostId = this.hostConfig.id as any;

    if (this.argWorkDir) {
      this.workDir = path.resolve(process.cwd(), this.argWorkDir);
    }
    else {
      // else use under a $SQUIDLET_ROOT
      const squidletRoot: string = resolveSquidletRoot();

      this.workDir = path.join(squidletRoot, HOSTS_WORK_DIRS, this.hostId);
    }

    this.setPathsToHostConfig();

    this.envSetDir = (this.hostConfig.config as any).envSetDir;
    this.tmpDir = (this.hostConfig.config as any).tmpDir;
  }


  private validate() {
    if (!this._hostConfig) {
      throw new Error(`You have to define host config`);
    }
    else if (!this._hostConfig.id) {
      throw new Error(`You have to specify an host id in your host config`);
    }
    else if (this.argHostName && this.argHostName !== this.hostConfig.id) {
      throw new Error(`Param "id" of host config "${this.hostId}" is not as specified as`
        + ` a command argument "${this.argHostName}"`);
    }
    else if (this.platform !== this.hostConfig.platform) {
      throw new Error(`Param "platform" of host config "${this.hostId}" is not a "${this.platform}"`);
    }
  }

  /**
   * Set config paths relative to squidlet work dir if it doesn't set.
   */
  private setPathsToHostConfig() {
    if (!this.hostConfig.config) {
      this.hostConfig.config = {};
    }

    if (!this.hostConfig.config.envSetDir) {
      this.hostConfig.config.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
    }

    if (!this.hostConfig.config.varDataDir) {
      this.hostConfig.config.varDataDir = path.join(this.workDir, HOST_VAR_DATA_DIR);
    }

    if (!this.hostConfig.config.tmpDir) {
      this.hostConfig.config.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
    }
  }

  private async resolveMachine(): Promise<NodejsMachines> {
    if (this.argMachine) {
      if (!nodejsSupportedMachines.includes(this.argMachine)) {
        throw new Error(`Unsupported machine type "${this.argMachine}"`);
      }

      return this.argMachine;
    }

    const spawnResult: SpawnCmdResult = await this.io.spawnCmd('hostnamectl');

    if (spawnResult.status !== 0) {
      throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
    }

    const {os, arch} = this.parseHostNameCtlResult(spawnResult.stdout.join('\n'));

    return this.resolveMachineByOsAndArch(os, arch);
  }

  private parseHostNameCtlResult(stdout: string): {os: string, arch: string} {
    const osMatch = stdout.match(/Operating System:\s*(.+)$/m);
    const architectureMatch = stdout.match(/Architecture:\s*([\w\d\-]+)/);

    if (!osMatch) {
      throw new Error(`Can't resolve an operating system of the machine`);
    }
    else if (!architectureMatch) {
      throw new Error(`Can't resolve an architecture of the machine`);
    }

    return {
      os: _trim(osMatch[1]),
      arch: architectureMatch[1],
    };
  }

  private resolveMachineByOsAndArch(os: string, arch: string): NodejsMachines {
    if (arch.match(/x86/)) {
      // no matter which OS and 32 or 64 bits
      return 'x86';
    }
    else if (arch === 'arm') {
      // TODO: use cpuinfo to resolve Revision or other method
      if (os.match(/Raspbian/)) {
        return 'rpi';
      }
      else {
        return 'arm';
      }
    }

    throw new Error(`Unsupported architecture "${arch}"`);
  }

}
