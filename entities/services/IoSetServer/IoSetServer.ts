import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import RemoteCall from 'system/helpers/remoteCall/RemoteCall';
import IoManager from 'system/entities/IoManager';
import ServiceBase from '../../../system/baseServices/ServiceBase';


// TODO: remake as service

export default class IoSetServer extends ServiceBase {
  private readonly ioManager: IoManager;
  private readonly sendToClient: (sessionId: string, message: RemoteCallMessage) => Promise<void>;
  private readonly responseTimoutSec: number;
  private readonly logError: (message: string) => void;
  private readonly generateUniqId: () => string;
  private remoteCalls: {[index: string]: RemoteCall} = {};


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
        this.callIoMethod,
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


  private callIoMethod = (pathToMethod: string, ...args: any[]): Promise<any> => {
    const [ioName, methodName] = pathToMethod.split('.');

    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioManager.getIo(ioName);

    return IoItem[methodName](...args);
  }

}
