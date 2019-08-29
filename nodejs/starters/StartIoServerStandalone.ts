import * as path from 'path';

import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import IoServer from '../../system/IoServer';
import IoSet from '../../system/interfaces/IoSet';
import IoItem from '../../system/interfaces/IoItem';
import StorageIo from '../../system/interfaces/io/StorageIo';
import {consoleError} from '../../system/lib/helpers';
import systemConfig from '../../system/config/systemConfig';
import IoSetDevelopSrc from '../ioSets/IoSetDevelopSrc';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import {mergeDeepObjects, omitObj} from '../../system/lib/objects';
import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';


export default class StartIoServerStandalone {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;
  private ioSet?: IoSet;
  private _systemCfg?: typeof systemConfig;

  private get systemCfg(): typeof systemConfig {
    return this._systemCfg as any;
  }


  constructor(
    configPath?: string,
    argForce?: boolean,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
  ) {
    this.groupConfig = new GroupConfigParser(this.os, configPath);
    this.props = new Props(
      this.os,
      this.groupConfig,
      argForce,
      argMachine,
      argHostName,
      argWorkDir,
      argUser,
      argGroup,
    );
  }


  async init() {
    await this.groupConfig.init();
    await this.props.resolve();
    this._systemCfg = this.makeSystemConfig();
    // load all the machine's io
    this.ioSet = await this.makeIoSet();

    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }

  async destroy() {
    if (!this.ioSet) throw new Error(`No IoSet`);

    // destroy of ios
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

    // destroy of ioSet
    await this.ioSet.destroy();
  }


  async start() {
    if (!this.ioSet) throw new Error(`No IoSet`);

    await this.os.mkdirP(this.props.varDataDir, { uid: this.props.uid, gid: this.props.gid });
    await this.os.mkdirP(this.props.envSetDir, { uid: this.props.uid, gid: this.props.gid });

    // TODO: install like in dev mode
    //await this.installModules();

    const ioServer = new IoServer(
      this.systemCfg,
      this.ioSet,
      this.shutdownRequestCb,
      console.info,
      consoleError
    );

    await ioServer.start();
  }

  private shutdownRequestCb = () => {
    console.warn(`WARNING: Restart isn't allowed in io-server standalone mode`);
  }

  private async makeIoSet(): Promise<IoSet> {
    const envBuilder = new EnvBuilder(this.preparePreHostConfig(), this.props.envSetDir, this.props.tmpDir);
    //const ioSet = new IoSetStandaloneIoServer(this.os, this.props.hostConfig, this.props.platform, this.props.machine);

    await envBuilder.collect();

    const ioSet: IoSet = new IoSetDevelopSrc(
      this.os,
      envBuilder,
      this.props.envSetDir,
      this.props.platform,
      this.props.machine
    );

    ioSet.prepare && await ioSet.prepare();
    ioSet.init && await ioSet.init(this.systemCfg);
    await this.configureStorage(ioSet);

    return ioSet;
  }

  /**
   * Remove useless props from host config such as entities definitions.
   */
  private preparePreHostConfig(): PreHostConfig {
    return omitObj(
      this.props.hostConfig,
      'plugins',
      'devices',
      'drivers',
      'services',
      'devicesDefaults',
      'automation',
      'consoleLogger',
      'mqttApi',
      'wsApi',
      'httpApi',
      'dependencies',
    );
  }

  private async configureStorage(ioSet: IoSet) {
    if (typeof this.props.uid === 'undefined' && typeof this.props.gid === 'undefined') return;

    const ioItem = ioSet.getIo<StorageIo>('Storage');

    await ioItem.configure({
      uid: this.props.uid,
      gid: this.props.gid,
    });
  }

  // TODO: remove
  private makeSystemConfig(): typeof systemConfig{
    return mergeDeepObjects({
      rootDirs: {
        envSet: this.props.envSetDir,
        varData: path.join(this.props.workDir, HOST_VAR_DATA_DIR),
        tmp: path.join(this.props.tmpDir, HOST_TMP_HOST_DIR),
      },
    }, systemConfig) as any;
  }
}
