import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import RemoteCall from '../system/helpers/remoteCall/RemoteCall';
import {deserializeJson, serializeJson} from '../system/helpers/binaryHelpers';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import WebSocketClient from '../nodejs/ios/WebSocketClient';
import {collectPropsDefaults} from './helpers';


const wsClientManifestPath = path.resolve(__dirname, '../entities/drivers/WsClient/manifest.yaml');
const wsClientIo = new WebSocketClient();


export default class WsApiClient {
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private readonly client: WsClientLogic;
  private readonly remoteCall: RemoteCall;


  constructor(
    responseTimoutSec: number,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void,
    generateUniqId: () => string,
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
      generateUniqId
    );
  }

  async init() {
    await this.client.init();
  }

  async destroy() {
    await this.remoteCall.destroy();
    await this.client.destroy();
  }


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
  private sendToServer = (message: RemoteCallMessage): Promise<void> => {
    const binData: Uint8Array = serializeJson(message);

    return this.client.send(binData);
  }

  /**
   * Decode income messages from server and pass it to remoteCall
   */
  private handleIncomeMessage = (data: string | Uint8Array) => {
    // TODO: use try
    const message: RemoteCallMessage = deserializeJson(data);

    this.remoteCall.incomeMessage(message)
      .catch(this.logError);
  }

  private makeClientProps(specifiedHost?: string, specifiedPort?: number): WsClientLogicProps {
    const yamlContent: string = fs.readFileSync(wsClientManifestPath, 'utf8');
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