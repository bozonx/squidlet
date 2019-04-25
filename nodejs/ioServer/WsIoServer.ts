import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import RemoteCall from '../../system/helpers/RemoteCall';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import {IoItemClass} from '../../system/interfaces/IoItem';
import WsServer from '../../shared/WsServer';


// TODO: remove
let uniqIndex = 10000;

const WS_SERVER_HOST_ID = 'wsServer';

export interface WsServerProps {
  host: string;
  port: number;
}


export default class WsIoServer {
  private readonly server: WsServer;
  private readonly ioCollection: {[index: string]: IoItemClass};
  private readonly remoteCalls: {[index: string]: RemoteCall} = {};


  constructor(serverProps: WsServerProps, ioCollection: {[index: string]: IoItemClass}, verbose?: boolean) {
    this.ioCollection = ioCollection;
    this.server = new WsServer(serverProps, verbose);

    this.listen();
  }


  private listen() {
    this.server.onError((err: string) => console.error(err));
    this.server.onIncomeMessage(this.parseIncomeMessage);
    this.server.onConnection(this.onConnection);
  }

  private onConnection = (remoteHostId: string) => {
    const sendToClient = async (message: RemoteCallMessage): Promise<void> => {
      return this.server.send(remoteHostId, message);
    };

    this.remoteCalls[remoteHostId] = new RemoteCall(
      sendToClient,
      this.ioCollection as any,
      WS_SERVER_HOST_ID,
      hostDefaultConfig.config.devSetResponseTimout,
      console.error,
      this.generateUniqId
    );
  }

  private parseIncomeMessage = async (remoteHostId: string, message: {[index: string]: any}) => {
    if (!this.remoteCalls[remoteHostId]) {
      return console.error(`WsIoServer: remote call for "${remoteHostId}" hasn't been instantiated`);
    }

    try {
      await this.remoteCalls[remoteHostId].incomeMessage(message);
    }
    catch (err) {
      console.error(err);
    }
  }

  private generateUniqId(): string {
    uniqIndex++;

    // TODO: make real id generation

    return String(uniqIndex);
  }

}
