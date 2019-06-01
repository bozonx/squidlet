import DriverBase from 'system/baseDrivers/DriverBase';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {omit} from '../../../system/helpers/lodashLike';


export interface MqttProps {
  url: string;
}


export class Mqtt extends DriverBase<MqttProps> {
  get openPromise(): Promise<void> {
    if (!this.connectionId) {
      throw new Error(`WebSocketClient.openPromise: ${this.closedMsg}`);
    }

    return this.client.openPromise;
  }

  private connectionId: string = '';

  private get mqttIo(): MqttIo {
    return this.env.getIo('Mqtt') as any;
  }
  private get closedMsg() {
    return `Connection "${this.props.url}" has been closed`;
  }


  protected willInit = async () => {
    this.mqttIo.onClose();
    this.mqttIo.onConnect();
    this.mqttIo.onError((connectionId: string, error: Error) => {
      this.env.log.error(`Mqtt connection "${connectionId}": ${error}`);
    });
    this.mqttIo.onMessage();

    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omit(this.props, 'url')
    );
  }

  destroy = async () => {
    if (!this.connectionId) return;

    // TODO: remove handlers

    this.client.end();
  }


  isConnected(): boolean {
    if (!this.connectionId) return false;

    return this.client.isConnected();
  }

  publish(topic: string, data: string | Uint8Array): Promise<void> {
    // TODO: add
    // TODO: отсылать только после connection
  }

  subscribe(topic: string): Promise<void> {
    // TODO: add
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
