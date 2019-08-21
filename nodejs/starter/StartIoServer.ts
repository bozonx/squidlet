import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';
import GroupConfigParser from '../../shared/GroupConfigParser';
import IoSet from '../../system/interfaces/IoSet';
import StorageIo from '../../system/interfaces/io/StorageIo';
import IoServer from '../../shared/IoServer';
import IoSetLocal from '../../system/IoSetLocal';


export default class StartIoServer {
  private readonly os: Os = new Os();
  private readonly groupConfig: GroupConfigParser;
  private readonly props: Props;


  constructor(
    configPath: string,
    argForce: boolean,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argUser?: string,
    argGroup?: string,
  ) {
    // TODO: configPath может не быть если просто запускаем без настроек
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
    // TODO: не все их этого нужно
    await this.props.resolve();

    console.info(`Use working dir ${this.props.workDir}`);
    console.info(`Use host "${this.props.hostConfig.id}" on machine "${this.props.machine}", platform "${this.props.platform}"`);
  }


  async start() {
    await this.os.mkdirP(this.props.varDataDir);
    await this.os.mkdirP(this.props.envSetDir);
    // TODO: install like in dev mode
    //await this.installModules();

    // TODO: load all the machine's io
    // TODO: здесь запрашивается индексный файл - а надо загружать реальные source файлы
    const ioSet = new IoSetLocal();
    const ioServer = new IoServer(ioSet);

    await ioServer.init();
  }

}
