import mqtt from 'mqtt';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

export class MqttDev {
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

  onMessage(handler: (data: string) => void) {
    const handlerWrapper = (data: Buffer) => {
      return data.toString();
    };

    this.client.on('message', handler);
  }

  /**
   * Subscribe to binary data
   */
  onMessageBin() {
    // TODO: convert to Uint8Array
  }

  // TODO: сделать offMessage и тд

}


export default {
  connect(params: Props): MqttDev {
    return new MqttDev(params);
  }
};
