import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import {deserializeJson, serializeJson} from '../system/lib/serialize';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import WebSocketClient from '../nodejs/ios/WebSocketClient';
import {makeUniqId} from '../system/lib/uniqId';
import {IO_API, IO_NAMES_METHOD, METHOD_DELIMITER} from '../system/IoServer';
import {WsCloseStatus} from '../system/interfaces/io/WebSocketClientIo';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


const wsClientIo = new WebSocketClient();


export default class IoClient {
  private readonly logDebug: (msg: string) => void;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private readonly client: WsClientLogic;
  private readonly remoteCall: RemoteCall;


  constructor(
    logDebug: (msg: string) => void,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void,
    host?: string,
    port?: number,
    responseTimoutSec?: number
  ) {
    this.logDebug = logDebug;
    this.logInfo = logInfo;
    this.logError = logError;

    const clientProps = this.makeClientProps(host, port);

    this.client = new WsClientLogic(
      wsClientIo,
      clientProps,
      () => this.logError(`Websocket connection has been closed`),
      this.logDebug,
      this.logInfo,
      this.logError
    );
    // listen income data
    this.client.onMessage(this.handleIncomeMessage);

    this.remoteCall = new RemoteCall(
      this.sendToServer,
      undefined,
      responseTimoutSec || hostDefaultConfig.config.rcResponseTimoutSec,
      this.logError,
      makeUniqId
    );
  }

  async init() {
    await this.client.init();
  }

  async destroy() {
    await this.remoteCall.destroy();
    await this.client.destroy();
  }


  /**
   * Call remote io's method
   */
  callIoMethod(ioName: string, methodName: string, ...args: any[]): Promise<any> {
    const pathToMethod = `${ioName}${METHOD_DELIMITER}${methodName}`;

    return this.remoteCall.callMethod(pathToMethod, ...args);
  }

  getIoNames(): Promise<string[]> {
    const pathToMethod = `${IO_API}${METHOD_DELIMITER}${IO_NAMES_METHOD}`;

    return this.remoteCall.callMethod(pathToMethod);
  }

  async close() {
    await this.remoteCall.destroy();
    await this.client.close(WsCloseStatus.closeNormal, 'finish');
  }


  /**
   * Encode and send remote call message to server
   */
  private sendToServer = async (message: RemoteCallMessage): Promise<void> => {
    let binData: Uint8Array;

    try {
      binData = serializeJson(message);
    }
    catch (err) {
      return this.logError(err);
    }

    await this.client.send(binData);
  }

  /**
   * Decode income messages from server and pass it to remoteCall
   */
  private handleIncomeMessage = async (data: string | Uint8Array) => {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.logError(`IoClient: Can't decode message: ${err}`);
    }

    await this.remoteCall.incomeMessage(msg);
  }

  private makeClientProps(specifiedHost?: string, specifiedPort?: number): WsClientLogicProps {
    const host: string = specifiedHost || hostDefaultConfig.ioServer.host;
    const port: number= specifiedPort || hostDefaultConfig.ioServer.port;
    const url = `ws://${host}:${port}`;

    return  {
      url,
      autoReconnect: false,
      reconnectTimeoutMs: 0,
      maxTries: 0,
      useCookie: false,
    };
  }

}
