import DriverBase from 'system/baseDrivers/DriverBase';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {omit} from '../../../system/helpers/lodashLike';


export interface MqttProps {
  url: string;
}


export class Mqtt extends DriverBase<MqttProps> {
  // TODO: make
  get connectedPromise(): Promise<void> {
    if (!this.connectionId) {
      throw new Error(`WebSocketClient.openPromise: ${this.closedMsg}`);
    }

    return this.client.openPromise;
  }

  private connectionId?: string;

  private get mqttIo(): MqttIo {
    return this.env.getIo('Mqtt') as any;
  }
  private get closedMsg() {
    return `Connection "${this.props.url}" has been closed`;
  }


  protected willInit = async () => {
    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omit(this.props, 'url')
    );

    this.mqttIo.onMessage();
    this.mqttIo.onClose((connectionId: string) => {
      if (connectionId !== this.connectionId) return;

      // TODO: resolve connection promise
    });
    this.mqttIo.onConnect((connectionId: string) => {
      if (connectionId !== this.connectionId) return;

      // TODO: resolve connection promise
    });
    this.mqttIo.onError((connectionId: string, error: Error) => {
      if (connectionId !== this.connectionId) return;

      this.env.log.error(`Mqtt connection "${connectionId}": ${error}`);
    });
  }

  destroy = async () => {
    if (!this.connectionId) return;

    // TODO: remove handlers

    this.client.end();
  }


  async isConnected(): Promise<boolean> {
    if (!this.connectionId) return false;

    return this.mqttIo.isConnected(this.connectionId);
  }

  async publish(topic: string, data: string | Uint8Array): Promise<void> {
    // TODO: add
    // TODO: отсылать только после connection


  }

  async subscribe(topic: string): Promise<void> {
    await this.connectedPromise;

    if (!this.connectionId) {
      throw new Error(`Mqtt driver subscribe: ${this.closedMsg}`);
    }

    return this.mqttIo.subscribe(this.connectionId, topic);
  }

  async end(): Promise<void> {
    if (!this.connectionId) return;

    return this.mqttIo.end(this.connectionId);
  }

  onMessage(): number {
    // TODO: add
  }

  onClose(cb: () => void): number {
    // TODO: add
  }

  removeMessageListener(handlerId: number) {
    if (!this.connectionId) return;

    this.client.removeMessageListener(handlerId);
  }

  removeCloseListener(handlerIndex: number) {
    this.closeEvents.removeListener(handlerIndex);
  }

// connectPromise: Promise<void>;
//
// private _connected: boolean = false;
// private readonly client: any;

// TODO: поддержка нескольких соединений как в ws

// async isConnected(): Promise<boolean> {
//   return this._connected;
// }


// this.connectPromise = new Promise((resolve) => {
//   this.client.on('connect', () => {
//     this._connected = true;
//     resolve();
//   });
// });

// TODO: делать publish только с connectionPromise

}


export default class Factory extends DriverFactoryBase<Mqtt> {
  protected DriverClass = Mqtt;
  protected instanceByPropName = 'url';
}
