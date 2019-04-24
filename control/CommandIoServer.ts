import WsIoServer, {WsServerProps} from '../nodejs/ioServer/WsIoServer';
import {getOsMachine, makeDevelopIoSet, resolvePlatformDir} from '../shared/helpers';
import NodejsMachines, {nodejsSupportedMachines} from '../nodejs/interfaces/NodejsMachines';
import Os from '../shared/Os';
import {DevClass} from '../system/entities/DevManager';
import Platforms, {NODEJS_PLATFORM} from '../hostEnvBuilder/interfaces/Platforms';


interface CommandIoServerArgs {
  host?: string;
  port?: number;
  machine?: NodejsMachines;
  verbose?: boolean;
}


export default class CommandIoServer {
  private readonly os: Os = new Os();
  private readonly args: CommandIoServerArgs;


  constructor(positionArgs: string[], args: CommandIoServerArgs) {
    this.args = args;
  }


  async start() {
    const serverProps: WsServerProps = {
      host: this.args.host || 'localhost',
      port: parseInt(this.args.port as any) || 8999,
    };

    const platform: Platforms = NODEJS_PLATFORM;
    const platformDir = resolvePlatformDir(platform);
    const machine: NodejsMachines = await this.resolveMachine();

    console.info(`===> Collecting IO set of platform "${platform}", machine "${machine}"`);

    const ioSet: {[index: string]: DevClass} = await makeDevelopIoSet(this.os, platformDir, machine);

    console.info(`===> Starting websocket server on ${serverProps.host}:${serverProps.port}`);

    const server = new WsIoServer(serverProps, ioSet, this.args.verbose);
  }

  private async resolveMachine(): Promise<NodejsMachines> {
    if (this.args.machine) {
      if (!nodejsSupportedMachines.includes(this.args.machine)) {
        throw new Error(`Unsupported machine type "${this.args.machine}"`);
      }

      return this.args.machine;
    }

    return getOsMachine(this.os);
  }

}
