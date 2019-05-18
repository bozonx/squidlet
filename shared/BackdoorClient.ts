import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WsClient/WsClientLogic';
import {collectPropsDefaults} from '../hostEnvBuilder/helpers';
import WebSocketClient from './nodeJsLikeIo/WebSocketClient';
import {BACKDOOR_ACTION, BACKDOOR_MSG_TYPE, BackdoorMessage} from '../entities/services/Backdoor/Backdoor';
import {decodeBackdoorMessage, makeMessage} from '../entities/services/Backdoor/helpers';
import IndexedEvents from '../system/helpers/IndexedEvents';


type ListenerHandler = (payload: any) => void;

const backdoorManifestPath = path.resolve(__dirname, '../entities/services/Backdoor/manifest.yaml');
const wsClientIo = new WebSocketClient();


export default class BackdoorClient {
  private readonly incomeMessageEvents = new IndexedEvents<(message: BackdoorMessage) => void>();
  private readonly client: WsClientLogic;

  constructor(host?: string, port?: number) {
    this.client = this.makeClientInstance(host, port);
    // listen income data
    this.client.onMessage(this.handleIncomeMessage);
  }

  destroy() {
    // TODO: remove all the handlers

    this.close();
  }


  close() {
    this.client.close(0, 'finish');
  }

  async send(action: number, payload?: any) {
    const binMsg: Uint8Array = makeMessage(BACKDOOR_MSG_TYPE.send, action, payload);

    await this.client.send(binMsg);
  }

  async request(action: number, payload?: any): Promise<any> {

    // TODO: generate uniq id
    const requestId = 'a';

    const binMsg: Uint8Array = makeMessage(BACKDOOR_MSG_TYPE.request, action, payload, requestId);

    await this.client.send(binMsg);

    // TODO: wait for respond

    return new Promise<any>((resolve, reject) => {
      // TODO: make it !!!!!!
    });
  }

  async addListener(action: number, cb: ListenerHandler): number {
    // TODO: make listener id
    //const listenerId = 0;
    // const binMsg: Uint8Array = makeMessage(BACKDOOR_MSG_TYPE.send, BACKDOOR_ACTION.addListener, listenerId);
    //
    // // Send intention to receive events
    // await this.client.send(binMsg);

    const handlerWrapper = (msg: BackdoorMessage) => {
      if (msg.type === BACKDOOR_MSG_TYPE.send && msg.action === action) {
        cb(msg.payload);
      }
    };

    return this.incomeMessageEvents.addListener(handlerWrapper);
  }


  private handleIncomeMessage = (data: string | Uint8Array) => {
    let message: BackdoorMessage;

    try {
      message = decodeBackdoorMessage(data as Uint8Array);
    }
    catch (err) {
      return console.error(`Can't decode message: ${err}`);
    }

    this.incomeMessageEvents.emit(message);
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
      () => console.info(`Websocket connection has been closed`),
      console.info,
      console.error
    );
  }

}
