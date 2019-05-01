import * as yaml from 'js-yaml';
import * as fs from 'fs';

import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WebSocketClient/WsClientLogic';
import WebSocketClient from '../shared/nodeJsLikeIo/WebSocketClient';
import {BACKDOOR_MESSAGE_TYPE, BackdoorMessage} from '../entities/services/Backdoor/Backdoor';
import {decodeJsonMessage, encodeJsonMessage} from '../entities/services/Backdoor/helpers';
import {collectPropsDefaults} from '../hostEnvBuilder/helpers';


const backdoorManifestPath = '../entities/services/Backdoor/manifest.yaml';


export default class BackdoorClient {
  private readonly client: WsClientLogic;


  constructor(host?: string, port?: number) {
    const yamlContent: string = fs.readFileSync(backdoorManifestPath, 'utf8');
    const backdoorManifest = yaml.safeLoad(yamlContent);
    const backdoorProps = collectPropsDefaults(backdoorManifest.props);
    const props: WsClientLogicProps = {
      host: host || backdoorProps.host,
      port: port || backdoorProps.port,
      autoReconnect: false,
      //reconnectTimeoutSec: 10,
      // TODO: remove
      clientId: 'client',
      //maxTries: 0,
    };
    const wsClientIo = new WebSocketClient();

    this.client = new WsClientLogic(
      wsClientIo,
      props,
      this.onClientClose,
      console.info,
      console.error
    );

    this.client.onMessage((data: string | Uint8Array) => {

      // TODO: ожидать только json type

      const message: BackdoorMessage = decodeJsonMessage(data as Uint8Array) as any;

      if (message.type !== BACKDOOR_MESSAGE_TYPE.listenerResponse) return;

      console.info(`${message.payload.category}:${message.payload.topic} - ${message.payload.data}`);
    });

  }


  close() {
    this.client.close(0);
  }

  async emit(category: string, topic?: string, data?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage(BACKDOOR_MESSAGE_TYPE.emit, category, topic, data);

    await this.client.send(binMsg);
  }

  async addListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage(BACKDOOR_MESSAGE_TYPE.addListener, category, topic);

    await this.client.send(binMsg);
  }

  async removeListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage(BACKDOOR_MESSAGE_TYPE.removeListener, category, topic);

    await this.client.send(binMsg);
  }


  private makeMessage(type: number, category: string, topic?: string, data?: string): Uint8Array {
    const message: BackdoorMessage = {
      type,
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

}
