import WsClientLogic, {WsClientLogicProps} from '../entities/drivers/WebSocketClient/WsClientLogic';
import WebSocketClient from '../shared/nodeJsLikeIo/WebSocketClient';
import {BackdoorMessageTypes} from '../entities/services/Backdoor/Backdoor';


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
      // TODO: convert to message
      // TODO: print
    });

  }


  close() {
    this.client.close(0);
  }

  async emit(category: string, topic?: string, data?: string) {
    // TODO: type of message
    const message = {
      type: 'emit',
      payload: {
        category,
        topic,
        data,
      }
    };

    // TODO: convert message to binary

    await this.client.send();
  }

  async addListener(category: string, topic?: string): Promise<number> {

    //, cb: (...args: any[]) => void

    const message = {
      type: 'addListener',
      payload: {
        category,
        topic,
      }
    };

    await this.client.send();


  }

  async removeListener(category: string, topic: string | undefined): Promise<void> {
    const message = {
      type: 'removeListener',
      payload: {
        category,
        topic,
      }
    };

    await this.client.send();
  }


  private makeMessage(type: BackdoorMessageTypes, category: string, topic?: string, data?: string): Uint8Array {
    const message = {
      type: 'removeListener',
      payload: {
        category,
        topic,
        data,
      }
    };
  }

  private onClientClose() {
    console.info(`Websocket connection has been closed`);
  }

}
