import * as yaml from 'js-yaml';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WebSocketClient/WsClientLogic';
import WebSocketClient from '../shared/nodeJsLikeIo/WebSocketClient';
import {BACKDOOR_ACTION, BackdoorMessage} from '../entities/services/Backdoor/Backdoor';
import {decodeJsonMessage, makeMessage} from '../entities/services/Backdoor/helpers';
import {collectPropsDefaults} from '../hostEnvBuilder/helpers';
import IndexedEvents from '../system/helpers/IndexedEvents';


const backdoorManifestPath = '../entities/services/Backdoor/manifest.yaml';
const wsClientIo = new WebSocketClient();


export default class BackdoorClient {
  private readonly incomeMessageEvents = new IndexedEvents<(message: BackdoorMessage) => void>();
  private readonly client: WsClientLogic;


  constructor(host?: string, port?: number) {
    this.client = this.makeClientInstance(host, port);
    // listen income data
    this.client.onMessage(this.handleIncomeMessage);
  }


  close() {
    this.client.close(0, 'finish');
  }

  /**
   * Emit remote event
   */
  async emit(category: string, topic?: string, data?: string): Promise<void> {
    const binMsg: Uint8Array = makeMessage(BACKDOOR_ACTION.emit, category, topic, data);

    await this.client.send(binMsg);
  }

  /**
   * Ask backdoor to send back data which emits on specified event
   */
  async addListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = makeMessage(BACKDOOR_ACTION.addListener, category, topic);

    await this.client.send(binMsg);
  }

  async removeListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = makeMessage(BACKDOOR_ACTION.removeListener, category, topic);

    await this.client.send(binMsg);
  }

  onIncomeMessage(cb: (message: BackdoorMessage) => void) {
    this.incomeMessageEvents.addListener(cb);
  }


  private handleIncomeMessage = (data: string | Uint8Array) => {
    let message: BackdoorMessage;

    try {
      message = decodeJsonMessage(data as Uint8Array) as any;
    }
    catch (err) {
      return console.error(`Can't decode message: ${err}`);
    }

    this.incomeMessageEvents.emit(message);
  }

  private onClientClose() {
    console.info(`Websocket connection has been closed`);
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
      reconnectTimeoutMs: 1000,
      maxTries: 0,
    };

    return new WsClientLogic(
      wsClientIo,
      props,
      this.onClientClose,
      console.info,
      console.error
    );
  }

}
