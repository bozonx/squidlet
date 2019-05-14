import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall, {ObjectToCall} from 'system/helpers/remoteCall/RemoteCall';
import categories from 'system/dict/categories';
import ServiceBase from 'system/baseServices/ServiceBase';
import topics from 'system/dict/topics';


export interface IoSetServerProps {
}


export default class IoSetServer extends ServiceBase<IoSetServerProps> {
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
      this.env.system.host.generateUniqId
    );

    this.env.system.events.addCategoryListener(categories.ioSet, this.handleIncomeData);

  }


  /**
   * Send message back to RemoteIoCollection
   */
  private sendToClient = async (message: RemoteCallMessage) => {
    this.env.system.events.emit(categories.ioSet, topics.ioSet.remoteCall, message);
  }

  private handleIncomeData = (data?: any) => {
    this.remoteCall.incomeMessage(data)
      .catch(this.env.system.log.error);
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
