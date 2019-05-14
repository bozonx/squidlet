import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall, {ObjectToCall} from 'system/helpers/remoteCall/RemoteCall';
import categories from 'system/dict/categories';
import topics from 'system/dict/topics';
import IoManager from 'system/entities/IoManager';


export default class IoSetServer {
  private ioManager: IoManager;
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;
  private remoteCalls: {[index: string]: RemoteCall} = {};
  private ioCollection: {[index: string]: ObjectToCall} = {};

  constructor(
    ioManager: IoManager,
    responseTimoutSec: number,
    logError: (message: string) => void,
    generateUniqId: () => string
  ) {
    this.ioManager = ioManager;
    this.responseTimoutSec = responseTimoutSec;
    this.logError = logError;
    this.generateUniqId = generateUniqId;

    // make io collection
    for (let ioName of this.ioManager.getNames()) {
      this.ioCollection[ioName] = this.ioManager.getIo(ioName);
    }
  }


  async destroy () {
    for (let clientId of Object.keys(this.remoteCalls)) {
      await this.remoteCalls[clientId].destroy();
    }
  }


  getIoNames(): string[] {
    return this.ioManager.getNames();
  }

  async incomeRemoteCallMessage(clientId: string, rawMessage: {[index: string]: any}) {
    this._remoteCall = new RemoteCall(
      this.sendToClient,
      ioCollection,
      this.responseTimoutSec,
      this.logError,
      this.generateUniqId
    );
    // TODO: use client id

    return this.remoteCall.incomeMessage(rawMessage);
  }

  connectionClosed(clientId: string) {

  }

  /**
   * Send message back to RemoteIoCollection
   */
  private sendToClient = async (message: RemoteCallMessage) => {
    this.env.events.emit(categories.ioSet, topics.ioSet.remoteCall, message);
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
