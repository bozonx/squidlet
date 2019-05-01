import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WebSocketClient/WsClientLogic';
import WebSocketClient from '../shared/nodeJsLikeIo/WebSocketClient';
import {BackdoorMessage, BackdoorMessageTypes} from '../entities/services/Backdoor/Backdoor';
import {decodeJsonMessage, encodeJsonMessage} from '../entities/services/Backdoor/helpers';


export default class BackdoorClient {
  private readonly client: WsClientLogic;


  constructor(host?: string, port?: number) {
    const props: WsClientLogicProps = {
      // TODO: !!!!
      // TODO: use defaults from backdoor service props
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
      const message: BackdoorMessage = decodeJsonMessage(data as Uint8Array) as any;

      if (message.type !== 'subscribe') return;

      console.info(`${message.payload.category}:${message.payload.topic} - ${message.payload.data}`);
    });

  }


  close() {
    this.client.close(0);
  }

  async emit(category: string, topic?: string, data?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage('emit', category, topic, data);

    await this.client.send(binMsg);
  }

  async addListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage('addListener', category, topic);

    await this.client.send(binMsg);
  }

  async removeListener(category: string, topic?: string): Promise<void> {
    const binMsg: Uint8Array = this.makeMessage('removeListener', category, topic);

    await this.client.send(binMsg);
  }


  private makeMessage(type: BackdoorMessageTypes, category: string, topic?: string, data?: string): Uint8Array {
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
