import DriverBase from 'system/baseDrivers/DriverBase';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import WsClientLogic from '../WsClient/WsClientLogic';


export interface MqttProps {
  url: string;
}


export class Mqtt extends DriverBase<MqttProps> {
  get openPromise(): Promise<void> {
    if (!this.client) {
      throw new Error(`WebSocketClient.openPromise: ${this.closedMsg}`);
    }

    return this.client.openPromise;
  }

  private client?: MqttIo;

  private get mqttIo(): MqttIo {
    return this.env.getIo('Mqtt') as any;
  }
  private get closedMsg() {
    return `Connection "${this.props.url}" has been closed`;
  }


  protected willInit = async () => {
    // TODO: make connection and add listeners
  }

  destroy = async () => {
    if (!this.client) return;
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
