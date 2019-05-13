import * as path from 'path';

import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import Props from './Props';
import NodejsMachines from '../interfaces/NodejsMachines';
import {makeSystemConfigExtend, SYSTEM_DIR} from './helpers';
import IoSet from '../../system/interfaces/IoSet';
import {HOST_ENVSET_DIR, IOSET_STRING_DELIMITER, SYSTEM_FILE_NAME} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';


const IOSET_DIR = path.resolve(__dirname, '../ioSet');


export default class StartDevelop {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private readonly argIoset?: string;


  constructor(
    configPath: string,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argIoset?: string,
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.argIoset = argIoset;
    this.props = new Props(
      this.os,
      this.groupConfig,
      argMachine,
      argHostName,
      argWorkDir
    );
  }

  async init() {
    await this.groupConfig.init();
    await this.props.resolve();

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}"`);
  }


  async start() {

    // TODO: review может вообще pigpio устанавливать глобально??? он не билдятся на x86
    // TODO: или лучше указывать в machine config

    // TODO: проверить чтобы были установленны node_modules в корне самого squidlet

    //await this.installModules();
    await this.startSystem();
  }


  /**
   * Resolve development io set (IoSetDevelopLocal or IoSetDevelopRemote)
   * and start development version of System.
   */
  private async startSystem() {
    const pathToSystem = path.join(SYSTEM_DIR, SYSTEM_FILE_NAME);
    const System = require(pathToSystem).default;
    const systemConfigExtend = makeSystemConfigExtend(this.props);
    const ioSet = this.makeIoSet();

    console.info(`===> Initializing system`);

    const system = new System(ioSet, systemConfigExtend);

    console.info(`===> Starting system`);

    return system.start();
  }

  /**
   * Resolve which io set will be used and make instance of it and pass ioSet config.
   */
  private makeIoSet(): IoSet {
    const ioSetFile: string = this.resolveIoSetType();
    const ioSetPath = path.join(IOSET_DIR, ioSetFile);
    const IoSetClass: new (envBuilder: EnvBuilder, paramsString?: string) => IoSet = require(ioSetPath).default;
    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);

    console.info(`--> using io set "${ioSetFile}"`);

    const ioSet = new IoSetClass(envBuilder, this.argIoset);

    ioSet.prepare && ioSet.prepare();

    return ioSet;
  }

  private resolveIoSetType(): string {
    if (this.argIoset) {
      return 'IoSetDevelopRemote';
    }

    return 'IoSetDevelopLocal';
  }

}


// /**
//  * Only nodejs-developLocal or nodejs-developWs ioSet types are allowed
//  * If there isn't hostConfig.ioSet or ioSet.type = local it returns undefined.
//  */
// private resolveIoSetType(): IoSetTypes {
//
//   // TODO: review
//
//   const ioSetConfig: IoSetConfig | undefined = this.props.hostConfig.ioSet;
//
//   if (!ioSetConfig || ioSetConfig.type === 'nodejs-developLocal') {
//     return 'nodejs-developLocal';
//   }
//   else if (ioSetConfig.type !== 'nodejs-developWs') {
//     throw new Error(`Unsupported ioSet type: "${ioSetConfig.type}"`);
//   }
//
//   return ioSetConfig.type;
// }

// /**
//  * Install node modules into squidlet repository in ./nodejs/<x86|rpi|arm>/ .
//  * It installs only if node_modules directory doesn't exist.
//  */
// private async installModules() {
//
//
//   const platformDir = resolvePlatformDir(this.props.platform);
//   const machineCwd: string = path.join(platformDir, this.props.machine);
//
//   // do not install node modules if they have been installed previously
//   if (await this.os.exists(path.join(machineCwd, 'node_modules'))) return;
//
//   console.info(`===> Install npm modules`);
//
//   await installNpmModules(this.os, machineCwd);
// }
