import * as path from 'path';

import {isEmptyObject} from '../../system/lib/objects';
import {SpawnCmdResult} from '../../shared/Os';
import IoSet from '../../system/interfaces/IoSet';
import {REPO_ROOT, SYSTEM_DIR} from '../../shared/helpers';
import StartDevelopBase from './StartDevelopBase';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import SystemStarter from './SystemStarter';


export default class StartDevelop extends StartDevelopBase {
  async init() {
    await super.init();

    console.info(`Using working dir ${this.props.workDir}`);
    console.info(`Using host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await super.start();

    await this.installModules();

    const ioSet: IoSet = await this.makeIoSet();
    const systemStarter = new SystemStarter(this.os, this.props);

    await systemStarter.start(SYSTEM_DIR, ioSet);
  }


  /**
   * Install modules that specified in host config according to platform.
   * It installs modules into root node_modules dir of squidlet repository.
   */
  private async installModules() {

    // TODO: review
    // TODO: why REPO_ROOT ????

    const dependencies = this.envBuilder.configManager.dependencies;

    if (!dependencies || isEmptyObject(dependencies)) return;

    const toInstallModules: string[] = [];

    for (let moduleName of Object.keys(dependencies)) {
      if (!this.props.force && await this.os.exists(path.join(REPO_ROOT, 'node_modules', moduleName))) continue;

      toInstallModules.push(`${moduleName}@${dependencies[moduleName]}`);
    }

    if (!toInstallModules.length) return;

    console.info(`===> Installing npm modules`);

    await this.installNpmModules(toInstallModules, REPO_ROOT);
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  protected async makeIoSet(): Promise<IoSet> {
    const ioSet = new IoSetDevelopSrc(
      this.os,
      // TODO: не передавать
      this.envBuilder,
      this.props.platform,
      this.props.machine,
    );

    ioSet.prepare && await ioSet.prepare();

    return ioSet;
  }

  /**
   * Install npm modules into node_modules of repository and don't save them to package.json
   */
  private async installNpmModules(modules: string[] = [], cwd: string) {
    const cmd = `npm install ${modules.join(' ')}`;

    const result: SpawnCmdResult = await this.os.spawnCmd(cmd, cwd, {
      uid: this.props.uid,
      gid: this.props.gid,
    });

    if (result.status) {
      console.error(`ERROR: npm ends with code ${result.status}`);
      console.error(result.stdout);
      console.error(result.stderr);
    }
  }

}
