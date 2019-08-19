import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import WebSocketClient from '../nodejs/ios/WebSocketClient';
import {ENCODE} from '../system/constants';
import {collectPropsDefaults} from '../system/lib/helpers';
import {makeUniqId} from '../system/lib/uniqId';


// TODO: откуда берем манифесн
const wsClientManifestPath = path.resolve(__dirname, '../entities/drivers/WsClient/manifest.yaml');
const wsClientIo = new WebSocketClient();


export default class IoServerClient {
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private readonly client: WsClientLogic;
  private readonly remoteCall: RemoteCall;


  constructor(
    responseTimoutSec: number,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void,
    host?: string,
    port?: number
  ) {
    this.logInfo = logInfo;
    this.logError = logError;

    const clientProps = this.makeClientProps(host, port);

    this.client = new WsClientLogic(
      wsClientIo,
      clientProps,
      () => this.logInfo(`Websocket connection has been closed`),
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
  callMethod(pathToMethod: string, ...args: any[]): Promise<any> {
    return this.remoteCall.callMethod(pathToMethod, ...args);
  }

  async close() {
    await this.remoteCall.destroy();
    await this.client.close(0, 'finish');
  }


  /**
   * Encode and send remote call message to server
   */
  private sendToServer = async (message: RemoteCallMessage): Promise<void> => {
    try {
      const binData: Uint8Array = serializeJson(message);

      return this.client.send(binData);
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
    const yamlContent: string = fs.readFileSync(wsClientManifestPath, ENCODE);
    const clientManifest = yaml.safeLoad(yamlContent);
    const clientProps = collectPropsDefaults(clientManifest.props);
    const host: string = specifiedHost || clientProps.host;
    const port: number= specifiedPort || clientProps.port;
    const url = `ws://${host}:${port}`;

    return  {
      url,
      autoReconnect: false,
      reconnectTimeoutMs: 0,
      maxTries: 0,
    };
  }

}
