import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import {deserializeJson, serializeJson} from '../system/lib/serialize';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import WebSocketClient from '../nodejs/ios/WebSocketClient';
import {ENCODE} from '../system/lib/constants';
import {collectPropsDefaults} from '../system/lib/helpers';
import {makeUniqId} from '../system/lib/uniqId';
import {WsCloseStatus} from '../system/interfaces/io/WebSocketClientIo';


const wsApiManifestPath = path.resolve(__dirname, '../entities/services/WsApi/manifest.yaml');
const wsClientIo = new WebSocketClient();


export default class WsApiClient {
  private readonly logDebug: (msg: string) => void;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private readonly client: WsClientLogic;
  private readonly remoteCall: RemoteCall;


  constructor(
    responseTimoutSec: number,
    logDebug: (msg: string) => void,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void,
    host?: string,
    port?: number
  ) {
    this.logDebug = logDebug;
    this.logInfo = logInfo;
    this.logError = logError;

    const clientProps = this.makeClientProps(host, port);

    this.client = new WsClientLogic(
      wsClientIo,
      clientProps,
      () => this.logInfo(`Websocket connection has been closed`),
      this.logDebug,
      this.logInfo,
      this.logError
    );
    // listen income data
    this.client.onMessage(this.handleIncomeMessage);

    this.remoteCall = new RemoteCall(
      this.sendToServer,
      undefined,
      responseTimoutSec,
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
   * Call api's method
   */
  callMethod(apiMethodName: string, ...args: any[]): Promise<any> {
    return this.remoteCall.callMethod(apiMethodName, ...args);
  }

  async close() {
    await this.remoteCall.destroy();
    await this.client.close(WsCloseStatus.closeNormal, 'finish');
  }


  /**
   * Encode and send remote call message to server
   */
  private sendToServer = async (message: RemoteCallMessage): Promise<void> => {
    try {
      const binData: Uint8Array = serializeJson(message);

      return await this.client.send(binData);
    }
    catch (err) {
      this.logError(err);
    }
  }

  /**
   * Decode income messages from server and pass it to remoteCall
   */
  private handleIncomeMessage = async (data: string | Uint8Array) => {
    try {
      const message: RemoteCallMessage = deserializeJson(data);

      await this.remoteCall.incomeMessage(message);
    }
    catch (err) {
      this.logError(err);
    }
  }

  private makeClientProps(specifiedHost?: string, specifiedPort?: number): WsClientLogicProps {
    const yamlContent: string = fs.readFileSync(wsApiManifestPath, ENCODE);
    const serviceManifest = yaml.safeLoad(yamlContent);
    const serviceProps = collectPropsDefaults(serviceManifest.props);
    const host: string = specifiedHost || 'localhost';
    const port: number= specifiedPort || serviceProps.port;
    const url = `ws://${host}:${port}`;

    return  {
      url,
      autoReconnect: false,
      reconnectTimeoutMs: 0,
      maxTries: 0,
      useCookie: true,
    };
  }

}
