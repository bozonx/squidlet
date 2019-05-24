import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall from 'system/helpers/remoteCall/RemoteCall';
import IoManager from 'system/entities/IoManager';


export default class IoSetServer {
  private readonly ioManager: IoManager;
  private readonly sendToClient: (sessionId: string, message: RemoteCallMessage) => Promise<void>;
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;
  private remoteCalls: {[index: string]: RemoteCall} = {};
  private readonly ioCollection: {[index: string]: ObjectToCall} = {};


  constructor(
    ioManager: IoManager,
    sendToClient: (sessionId: string, message: RemoteCallMessage) => Promise<void>,
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

  async incomeMessage(sessionId: string, rawRemoteCallMessage: {[index: string]: any}) {
    if (!this.remoteCalls[sessionId]) {
      this.remoteCalls[sessionId] = new RemoteCall(
        (message: RemoteCallMessage) => this.sendToClient(sessionId, message),
        (objectName: string, method: string, args: any[]): Promise<any> => {
          return this.ioCollection[objectName][method](...args);
        },
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
