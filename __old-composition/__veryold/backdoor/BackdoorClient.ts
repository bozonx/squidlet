
// TODO: ???? remove ???


import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../../../../squidlet-networking/src/drivers/WsClientSessions/WsClientLogic';
import WebSocketClient from '../../nodejs/ios/WebSocketClient';
import {BACKDOOR_MSG_TYPE, BackdoorMessage} from '../../entities/services/Backdoor/Backdoor';
import {decodeBackdoorMessage, makeMessage, validateMessage} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/backdoor/helpers.js';
import IndexedEvents from '../../system/helpers/IndexedEvents';
import {collectPropsDefaults} from '../../shared/helpers';


type ListenerHandler = (payload: any) => void;

const backdoorManifestPath = path.resolve(__dirname, '../entities/services/Backdoor/manifest.yaml');
const wsClientIo = new WebSocketClient();
const BACKDOOR_REQUEST_TIMEOUT_SEC = 30;


export default class BackdoorClient {
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

  async init() {
    await this.client.init();
  }

  async destroy() {
    this.incomeMessageEvents.removeAll();
    await this.client.destroy();
  }


  async close() {
    await this.client.close(0, 'finish');
  }

  async send(action: number, payload?: any) {
    const binMsg: Uint8Array = makeMessage(BACKDOOR_MSG_TYPE.send, action, payload);

    await this.client.send(binMsg);
  }

  async request(action: number, payload?: any): Promise<any> {

    // TODO: generate uniq id
    // TODO: впринципе можно не делать requestId, а просто смотреть по action
    const requestId = 'a';

    const binMsg: Uint8Array = makeMessage(BACKDOOR_MSG_TYPE.request, action, payload, requestId);

    await this.client.send(binMsg);

    return this.waitForRespond(requestId);
  }

  addListener(action: number, cb: ListenerHandler): number {
    const handlerWrapper = (msg: BackdoorMessage) => {
      if (msg.type === BACKDOOR_MSG_TYPE.send && msg.action === action) {
        cb(msg.payload);
      }
    };

    return this.incomeMessageEvents.addListener(handlerWrapper);
  }

  removeListener(handlerIndex: number) {
    this.incomeMessageEvents.removeListener(handlerIndex);
  }


  private waitForRespond(requestId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let handlerIndex: number;
      const waitTimeout = setTimeout(() => {
        this.incomeMessageEvents.removeListener(handlerIndex);
        reject(`BackdoorClient.request: Timeout is exceeded`);
      }, BACKDOOR_REQUEST_TIMEOUT_SEC * 1000);

      handlerIndex = this.incomeMessageEvents.addListener((msg: BackdoorMessage) => {
        if (msg.type !== BACKDOOR_MSG_TYPE.respond || msg.requestId !== requestId) return;

        clearTimeout(waitTimeout);
        this.incomeMessageEvents.removeListener(handlerIndex);
        resolve(msg.payload);
      });
    });
  }

  /**
   * Decode all the income messages
   */
  private handleIncomeMessage = (data: string | Uint8Array) => {
    let msg: BackdoorMessage;

    try {
      msg = decodeBackdoorMessage(data as Uint8Array);
    }
    catch (err) {
      return this.logError(`Can't decode message: ${err}`);
    }

    const validationError: string | undefined = validateMessage(msg);

    if (validationError) return this.logError(validationError);

    this.incomeMessageEvents.emit(msg);
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
