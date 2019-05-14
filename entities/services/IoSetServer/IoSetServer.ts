import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall from 'system/helpers/remoteCall/RemoteCall';
import IoItem from 'system/interfaces/IoItem';
import categories from 'system/dict/categories';
import ServiceBase from 'system/baseServices/ServiceBase';


// TODO: remove
let uniqIndex = 10000;

export interface IoSetServerProps {
}


export default class IoSetServer extends ServiceBase<IoSetServerProps> {
  private readonly ioCollection: {[index: string]: IoItem} = {};
  private readonly remoteCalls: {[index: string]: RemoteCall} = {};


  // constructor(serverProps: WsServerProps, ioClasses: {[index: string]: IoItemClass}, verbose?: boolean) {
  //
  // }

  async init() {
    this.env.system.events.addCategoryListener(categories.ioSet, this.handleIncomeMessages);

    // // make dev instances
    // for (let ioName of Object.keys(ioClasses)) {
    //   this.ioCollection[ioName] = new ioClasses[ioName]();
    // }
    //
    // this.listen();
    //
    // // call init() method of all the io
    // for (let ioName of Object.keys(this.ioCollection)) {
    //   const ioItem: IoItem = this.ioCollection[ioName];
    //
    //   if (ioItem.init) await ioItem.init();
    // }
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
      hostDefaultConfig.config.ioSetResponseTimoutSec,
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
