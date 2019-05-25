import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import IndexedEvents from '../system/helpers/IndexedEvents';
import {BackdoorMessage} from '../entities/services/Backdoor/Backdoor';
import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import {collectPropsDefaults} from './helpers';
import WebSocketClient from '../nodejs/ios/WebSocketClient';


const wsClientIo = new WebSocketClient();


export default class WsApiClient {
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private readonly incomeMessageEvents = new IndexedEvents<(message: BackdoorMessage) => void>();
  private readonly client: WsClientLogic;


  constructor(
    logInfo: (msg: string) => void,
    logError: (msg: string) => void,
    host?: string,
    port?: number
  ) {
    this.logInfo = logInfo;
    this.logError = logError;
    this.client = this.makeClientInstance(host, port);
    // listen income data
    this.client.onMessage(this.handleIncomeMessage);
  }




  private makeClientInstance(specifiedHost?: string, specifiedPort?: number): WsClientLogic {
    const yamlContent: string = fs.readFileSync(backdoorManifestPath, 'utf8');
    const backdoorManifest = yaml.safeLoad(yamlContent);
    const backdoorProps = collectPropsDefaults(backdoorManifest.props);
    const host: string = specifiedHost || backdoorProps.host;
    const port: number= specifiedPort || backdoorProps.port;
    const url = `ws://${host}:${port}`;
    const props: WsClientLogicProps = {
      url,
      autoReconnect: false,
      reconnectTimeoutMs: 0,
      maxTries: 0,
    };

    return new WsClientLogic(
      wsClientIo,
      props,
      () => this.logInfo(`Websocket connection has been closed`),
      this.logInfo,
      this.logError
    );
  }

}
