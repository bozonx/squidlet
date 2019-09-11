import HttpServerLogic from '../../entities/drivers/HttpServer/HttpServerLogic';
import Promised from '../lib/Promised';
import RemoteCall from '../lib/remoteCall/RemoteCall';
import {makeUniqId} from '../lib/uniqId';
import RemoteCallMessage from '../interfaces/RemoteCallMessage';
import {deserializeJson, serializeJson} from '../lib/serialize';


export const METHOD_DELIMITER = '.';


/**
 * Serving of connection to IO server
 */
export default class IoServerConnection {
  private readonly connectionId: string;
  private readonly logDebug: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private httpServer?: HttpServerLogic;
  // wait for connection is prepared
  private connectionPrepared?: Promised<void>;


  constructor(
    connectionId: string,
    logDebug: (msg: string) => void,
    logError: (msg: string) => void
  ) {
    this.connectionId = connectionId;
    this.logDebug = logDebug;
    this.logError = logError;
  }

  async init() {
    this.connectionPrepared = new Promised<void>();

    this.remoteCall = new RemoteCall(
      this.sendToClient,
      this.callIoMethod,
      this.hostConfig.config.rcResponseTimoutSec,
      this.logError,
      makeUniqId
    );

    this.connectionPrepared.resolve();

  }

  async destroy() {
    delete this.httpServer;
    this.remoteCall && this.remoteCall.destroy()
      .catch(this.logError);

    if (!this.httpServer) {
      this.initHttpApiServer()
        .catch(this.logError);
    }
    this.remoteCall && await this.remoteCall.destroy();
    delete this.remoteCall;
    // TODO: connectionPrepared
  }


  async incomeMessage(connectionId: string, data: string | Uint8Array) {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      throw new Error(`IoServer: Can't decode message: ${err}`);
    }


    if (!this.connectionPrepared) {
      throw new Error(`IoServer: no promise which waits for connection is prepared`);
    }
    else if (!this.remoteCall) {
      throw new Error(`IoServer: remoteCall isn't defined`);
    }

    await this.connectionPrepared.promise;

    this.logDebug(`Income IO message: ${JSON.stringify(msg)}`);

    return await this.remoteCall.incomeMessage(msg);
  }

  private sendToClient = async (message: RemoteCallMessage): Promise<void> => {
    if (!this.connectionId) return;

    let binData: Uint8Array;

    try {
      binData = serializeJson(message);
    }
    catch (err) {
      return this.logError(err);
    }

    this.logDebug(`Outcome IO message: ${JSON.stringify(message)}`);

    return this.wsServer.send(this.connectionId, binData);
  }

  private callIoMethod = async (fullName: string, args: any[]): Promise<any> => {
    const [ioName, methodName] = fullName.split(METHOD_DELIMITER);

    if (!methodName) {
      throw new Error(`No method name: "${fullName}"`);
    }

    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioSet.getIo(ioName);

    if (!IoItem[methodName]) {
      throw new Error(`Method doesn't exist: "${ioName}.${methodName}"`);
    }

    return IoItem[methodName](...args);
  }

}
