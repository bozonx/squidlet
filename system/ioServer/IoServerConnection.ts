import Promised from '../lib/Promised';
import RemoteCall from '../lib/remoteCall/RemoteCall';
import {makeUniqId} from '../lib/uniqId';
import {deserializeJson, serializeJson} from '../lib/serialize';
import RemoteCallMessage from '../interfaces/RemoteCallMessage';
import HostConfig from '../interfaces/HostConfig';
import IoSet from '../interfaces/IoSet';


export const METHOD_DELIMITER = '.';


/**
 * Serving of connection to IO server
 */
export default class IoServerConnection {
  private readonly connectionId: string;
  private readonly hostConfig: HostConfig;
  private readonly ioSet: IoSet;
  private readonly wsServerSend: (connectionId: string, data: string | Uint8Array) => Promise<void>;
  private readonly logDebug: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private readonly remoteCall: RemoteCall;
  // wait for connection is prepared
  private readonly readyState = new Promised<void>();


  constructor(
    connectionId: string,
    ioSet: IoSet,
    hostConfig: HostConfig,
    wsServerSend: (connectionId: string, data: string | Uint8Array) => Promise<void>,
    logDebug: (msg: string) => void,
    logError: (msg: string) => void
  ) {
    this.connectionId = connectionId;
    this.hostConfig = hostConfig;
    this.ioSet = ioSet;
    this.wsServerSend = wsServerSend;
    this.logDebug = logDebug;
    this.logError = logError;
    this.remoteCall = new RemoteCall(
      this.sendToClient,
      this.callIoMethod,
      hostConfig.config.rcResponseTimoutSec,
      this.logError,
      makeUniqId
    );
  }

  async destroy() {
    await this.remoteCall.destroy();
    this.readyState.destroy();
  }


  /**
   * Set ready state of connection.
   * Call it after you prepared your things to connect them.
   */
  setReadyState() {
    this.readyState.resolve();
  }

  async incomeMessage(connectionId: string, data: string | Uint8Array) {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      throw new Error(`IoServer: Can't decode message: ${err}`);
    }

    if (!this.readyState) {
      throw new Error(`IoServer: no promise which waits for connection is prepared`);
    }
    else if (!this.remoteCall) {
      throw new Error(`IoServer: remoteCall isn't defined`);
    }

    await this.readyState.promise;

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

    return this.wsServerSend(this.connectionId, binData);
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
