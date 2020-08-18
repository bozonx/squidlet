import path from 'path';
import fs from 'fs';

import RemoteCall from '../../system/lib/remoteCall/RemoteCall';
import {deserializeJson, serializeJson} from '../../system/lib/serialize';
import RemoteCallMessage from '../../system/interfaces/RemoteCallMessage';
import WsClientLogic, {WsClientLogicProps} from '../../entities/drivers/WsClient/WsClientLogic';
import WebSocketClient from '../../platforms/nodejs/ios/WebSocketClient';
import {makeUniqId} from '../../system/lib/uniqId';
import {WsCloseStatus} from '../../system/interfaces/io/WebSocketClientIo';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';
import {METHOD_DELIMITER} from '../../system/constants';
import {ENCODE} from '../../system/lib/constants';
import * as yaml from 'js-yaml';
import {collectPropsDefaults} from '../../system/lib/helpers';


const wsApiManifestPath = path.resolve(__dirname, '../../entities/services/IoServer/manifest.yaml');
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
      () => this.logError(`Websocket client connection has been closed`),
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
   * Call remote platforms's method
   */
  callIoMethod(ioName: string, methodName: string, ...args: any[]): Promise<any> {
    const pathToMethod = `${ioName}${METHOD_DELIMITER}${methodName}`;

    this.logDebug(`IoClient.callIoMethod: ${pathToMethod}, ${JSON.stringify(args)}`);

    return this.remoteCall.callMethod(pathToMethod, ...args);
  }

  async close() {
    this.logDebug(`IoClient manually close connection`);
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

    this.logDebug(`IoClient send to server ${JSON.stringify(message)}`);

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

    this.logDebug(`IoClient income message ${JSON.stringify(msg)}`);

    await this.remoteCall.incomeMessage(msg);
  }

  private makeClientProps(specifiedHost?: string, specifiedPort?: number): WsClientLogicProps {
    const yamlContent: string = fs.readFileSync(wsApiManifestPath, ENCODE);
    const serviceManifest = yaml.safeLoad(yamlContent);
    const serviceProps = collectPropsDefaults(serviceManifest.props);
    const host: string = specifiedHost || serviceProps.host;
    const port: number= specifiedPort || serviceProps.port;
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
