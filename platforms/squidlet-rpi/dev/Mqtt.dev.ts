import * as mqtt from 'mqtt';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

export class MqttDevConnection {
  connectPromise: Promise<void>;

  private _connected: boolean = false;
  private readonly client: any;

  constructor(params: Props) {
    const url = `${params.protocol}://${params.host}:${params.port}`;
    this.client = mqtt.connect(url);

    this.connectPromise = new Promise((resolve) => {
      this.client.on('connect', () => {
        this._connected = true;
        resolve();
      });
    });
  }

  isConnected(): boolean {
    return this._connected;
  }

  publish(topic: string, data: string | Uint8Array | undefined): Promise<void> {
    return this.connectPromise
      .then(() => this.client.publish(topic, data));
  }

  onMessage(handler: (topic: string, data: string) => void) {
    const handlerWrapper = (topic: string, data: Buffer) => {
      handler(topic, data.toString());
    };

    this.client.on('message', handlerWrapper);
  }

  /**
   * Subscribe to binary data
   */
  onMessageBin() {
    // TODO: convert to Uint8Array
  }

  // TODO: сделать offMessage и тд

}


export default class MqttDev {
  connect(params: Props): MqttDevConnection {
    return new MqttDevConnection(params);
  }
};
