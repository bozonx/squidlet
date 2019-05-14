import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall, {ObjectToCall} from 'system/helpers/remoteCall/RemoteCall';
import IoItem from 'system/interfaces/IoItem';
import categories from 'system/dict/categories';
import ServiceBase from 'system/baseServices/ServiceBase';
import topics from 'system/dict/topics';


// TODO: remove
let uniqIndex = 10000;

export interface IoSetServerProps {
}


export default class IoSetServer extends ServiceBase<IoSetServerProps> {
  //private readonly ioCollection: {[index: string]: IoItem} = {};
  private _remoteCall?: RemoteCall;
  private get remoteCall(): RemoteCall {
    return this._remoteCall as any;
  }


  protected willInit = async () => {
    const ioCollection: {[index: string]: ObjectToCall} = {};

    // make dev instances
    for (let ioName of this.env.system.ioManager.getNames()) {
      ioCollection[ioName] = this.env.system.ioManager.getIo(ioName);
    }

    this._remoteCall = new RemoteCall(
      this.sendToClient,
      ioCollection,
      this.env.system.host.config.config.ioSetResponseTimoutSec,
      console.error,
      this.generateUniqId
    );

    this.env.system.events.addCategoryListener(categories.ioSet, (data?: any) => {
      this.remoteCall.incomeMessage(data)
        .catch(this.env.system.log.error);
    });

  }


  /**
   * Send message back to RemoteIoCollection
   */
  private sendToClient = async (message: RemoteCallMessage) => {
    this.env.system.events.emit(categories.ioSet, topics.ioSet.remoteCall, message);
  }

  private generateUniqId(): string {
    uniqIndex++;

    // TODO: make real id generation

    return String(uniqIndex);
  }

}

//this.server.onConnection(this.onConnection);
// private onConnection = (remoteHostId: string) => {
//   const sendToClient = async (message: RemoteCallMessage): Promise<void> => {
//     return this.server.send(remoteHostId, message);
//   };
//
//   this.remoteCalls[remoteHostId] = new RemoteCall(
//     sendToClient,
//     this.ioCollection as any,
//     hostDefaultConfig.config.ioSetResponseTimoutSec,
//     console.error,
//     this.generateUniqId
//   );
// }
