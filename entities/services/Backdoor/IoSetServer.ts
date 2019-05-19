import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall, {ObjectToCall} from 'system/helpers/remoteCall/RemoteCall';
import IoManager from 'system/entities/IoManager';


export default class IoSetServer {
  private readonly ioManager: IoManager;
  private readonly sendToClient: (data: Uint8Array) => Promise<void>;
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;
  private remoteCalls: {[index: string]: RemoteCall} = {};
  private readonly ioCollection: {[index: string]: ObjectToCall} = {};


  constructor(
    ioManager: IoManager,
    sendToClient: (data: Uint8Array) => Promise<void>,
    responseTimoutSec: number,
    logError: (message: string) => void,
    generateUniqId: () => string
  ) {
    this.ioManager = ioManager;
    this.sendToClient = sendToClient;
    this.responseTimoutSec = responseTimoutSec;
    this.logError = logError;
    this.generateUniqId = generateUniqId;

    // make io collection
    for (let ioName of this.ioManager.getNames()) {
      this.ioCollection[ioName] = this.ioManager.getIo(ioName);
    }
  }

  async destroy () {
    for (let sessionId of Object.keys(this.remoteCalls)) {
      await this.remoteCalls[sessionId].destroy();
    }

    this.remoteCalls = {};
  }


  getIoNames(): string[] {
    return this.ioManager.getNames();
  }

  // private handleIncomeIoSetRcMsg(sessionId: string, rawRemoteCallMessage: {[index: string]: any}) {
  //   this.ioSet.incomeMessage(sessionId, rawRemoteCallMessage)
  //     .catch(this.env.log.error);
  // }

  async incomeMessage(sessionId: string, data: Uint8Array) {
    // message: RemoteCallMessage
    //rawRemoteCallMessage: {[index: string]: any}
    if (!this.remoteCalls[sessionId]) {
      this.remoteCalls[sessionId] = new RemoteCall(
        this.sendToClient,
        this.ioCollection,
        this.responseTimoutSec,
        this.logError,
        this.generateUniqId
      );
    }

    return this.remoteCalls[sessionId].incomeMessage(rawRemoteCallMessage);
  }

  /**
   * Call this method if session has just been closed
   */
  async sessionClosed(sessionId: string) {
    await this.remoteCalls[sessionId].destroy();
    delete this.remoteCalls[sessionId];
  }

}
