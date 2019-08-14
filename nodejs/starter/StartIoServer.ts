import NodejsMachines from '../interfaces/NodejsMachines';
import Props from './Props';
import Os from '../../shared/Os';


export default class StartIoServer {
  private readonly os: Os = new Os();
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
    // TODO: resolve machine
    // TODO: конфиг не обязателен - смотрить только machine, io definitions
    // TODO: load all the machine's io
    // TODO: start IoServer
  }


  async start() {

  }

}
