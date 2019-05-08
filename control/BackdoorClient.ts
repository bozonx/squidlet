import * as yaml from 'js-yaml';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WebSocketClient/WsClientLogic';
import WebSocketClient from '../shared/nodeJsLikeIo/WebSocketClient';
import {BACKDOOR_ACTION, BackdoorMessage} from '../entities/services/Backdoor/Backdoor';
import {decodeJsonMessage, encodeJsonMessage} from '../entities/services/Backdoor/helpers';
import {collectPropsDefaults} from '../hostEnvBuilder/helpers';


const backdoorManifestPath = '../entities/services/Backdoor/manifest.yaml';
const wsClientIo = new WebSocketClient();


export default class BackdoorClient {
  private readonly client: WsClientLogic;


  constructor(host?: string, port?: number) {
    this.client = this.makeChannelsInstance(host, port);
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
    const binMsg: Uint8Array = this.makeMessage(BACKDOOR_ACTION.emit, category, topic, data);

    await this.client.send(binMsg);
  }

  /**
   * Ask backdoor to send back data which emits on specified event
   */
  async addListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage(BACKDOOR_ACTION.addListener, category, topic);

    await this.client.send(binMsg);
  }

  // TODO: does it really need?
  // async removeListener(category: string, topic?: string): Promise<void> {
  //   const binMsg: Uint8Array = this.makeMessage(BACKDOOR_ACTION.removeListener, category, topic);
  //
  //   await this.client.send(binMsg);
  // }


  private handleIncomeMessage = (data: string | Uint8Array) => {
    let message: BackdoorMessage;

    try {
      message = decodeJsonMessage(data as Uint8Array) as any;
    }
    catch (err) {
      return console.error(`Can't decode message: ${err}`);
    }

    // TODO: сделать через события

    // print only data which is send on previously added listener
    if (message.action !== BACKDOOR_ACTION.listenerResponse) return;

    console.info(`${message.payload.category}:${message.payload.topic} - ${message.payload.data}`);
  }

  private makeMessage(action: number, category: string, topic?: string, data?: string): Uint8Array {
    const message: BackdoorMessage = {
      action,
      payload: {
        category,
        topic,
        data,
      }
    };

    return encodeJsonMessage(message);
  }

  private onClientClose() {
    console.info(`Websocket connection has been closed`);
  }

  private makeChannelsInstance(specifiedHost?: string, specifiedPort?: number): WsClientLogic {
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
