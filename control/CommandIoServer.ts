import WsIoServer, {WsServerProps} from '../ioServer/WsIoServer';
import {ObjectToCall} from '../system/helpers/RemoteCall';


interface CommandIoServerArgs extends WsServerProps {
}


export default class CommandStart {
  private readonly args: CommandIoServerArgs;


  constructor(positionArgs: string[], args: CommandIoServerArgs) {
    this.args = args;
  }


  async start() {
    const serverProps: WsServerProps = {
      host: this.args.host || 'localhost',
      port: parseInt(this.args.port as any) || 8999,
    };

    // TODO: collect ioset

    const ioSet: {[index: string]: ObjectToCall} = {};

    const server = new WsIoServer(serverProps, ioSet);
  }

}
