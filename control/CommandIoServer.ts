import WsIoServer, {WsServerProps} from '../nodejs/ioServer/WsIoServer';
import {getOsMachine, makeDevelopIoSet, resolvePlatformDir} from '../shared/helpers';
import {NODEJS_PLATFORM} from '../shared/constants';
import NodejsMachines, {nodejsSupportedMachines} from '../nodejs/interfaces/NodejsMachines';
import Io from '../shared/Io';
import {DevClass} from '../system/entities/DevManager';


interface CommandIoServerArgs {
  host?: string;
  port?: number;
  machine?: NodejsMachines;
}


export default class CommandIoServer {
  private readonly io: Io = new Io();
  private readonly args: CommandIoServerArgs;


  constructor(positionArgs: string[], args: CommandIoServerArgs) {
    this.args = args;
  }


  async start() {
    const serverProps: WsServerProps = {
      host: this.args.host || 'localhost',
      port: parseInt(this.args.port as any) || 8999,
    };

    const platformDir = resolvePlatformDir(NODEJS_PLATFORM);
    const machine: NodejsMachines = await this.resolveMachine();
    const ioSet: {[index: string]: DevClass} = await makeDevelopIoSet(this.io, platformDir, machine);

    const server = new WsIoServer(serverProps, ioSet);
  }

  private async resolveMachine(): Promise<NodejsMachines> {
    if (this.args.machine) {
      if (!nodejsSupportedMachines.includes(this.args.machine)) {
        throw new Error(`Unsupported machine type "${this.args.machine}"`);
      }

      return this.args.machine;
    }

    return getOsMachine(this.io);
  }

}
