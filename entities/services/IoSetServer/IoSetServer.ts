

// TODO: remove


import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall, {ObjectToCall} from 'system/helpers/remoteCall/RemoteCall';
import categories from 'system/dict/categories';
import ServiceBase from 'system/baseServices/ServiceBase';
import topics from 'system/dict/topics';


export interface IoSetServerMessage {
  clientId: string;
  msg: RemoteCallMessage;
}

export interface IoSetServerProps {
}


export default class IoSetServer extends ServiceBase<IoSetServerProps> {
  private _remoteCall?: RemoteCall;
  private get remoteCall(): RemoteCall {
    return this._remoteCall as any;
  }


  protected willInit = async () => {
    const ioCollection: {[index: string]: ObjectToCall} = {};

    // make io collection
    for (let ioName of this.env.system.ioManager.getNames()) {
      ioCollection[ioName] = this.env.system.ioManager.getIo(ioName);
    }

    this._remoteCall = new RemoteCall(
      this.sendToClient,
      ioCollection,
      this.env.system.host.config.config.ioSetResponseTimoutSec,
      this.env.log.error,
      this.env.system.host.generateUniqId
    );

    // listen income messages of remoteCall
    this.env.events.addListener(categories.ioSet, topics.ioSet.remoteCall, this.handleIncomeRemoteCall);
    // listen asking of io names
    this.env.events.addListener(categories.ioSet, topics.ioSet.askIoNames, this.handleAskIoNames);
  }

  protected destroy = async () => {
    await this.remoteCall.destroy();
  }


  /**
   * Send message back to RemoteIoCollection
   */
  private sendToClient = async (message: RemoteCallMessage) => {
    this.env.events.emit(categories.ioSet, topics.ioSet.remoteCall, message);
  }

  private handleIncomeRemoteCall = (rawMessage: {[index: string]: any}) => {
    this.remoteCall.incomeMessage(rawMessage)
      .catch(this.env.system.log.error);
  }

  private handleAskIoNames = () => {
    const ioNames: string[] = this.env.system.ioManager.getNames();

    this.env.events.emit(categories.ioSet, topics.ioSet.askIoNames, ioNames);
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
