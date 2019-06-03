import DriverBase from 'system/baseDrivers/DriverBase';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {omit} from 'system/helpers/lodashLike';
import IndexedEvents from 'system/helpers/IndexedEvents';


type MqttMessageHandler = (topic: string, data: string | Uint8Array) => void;

export interface MqttProps {
  url: string;
}


export class Mqtt extends DriverBase<MqttProps> {
  // TODO: maybe use common code with WsClientLogic
  // on first time connect or reconnect
  get connectedPromise(): Promise<void> {
    if (!this.connectionId || !this.openPromise) {
      throw new Error(`Mqtt.connectedPromise: ${this.closedMsg}`);
    }

    return this.openPromise;
  }

  private readonly messageEvents = new IndexedEvents<MqttMessageHandler>();
  private openPromise?: Promise<void>;
  private openPromiseResolve: () => void = () => {};
  private openPromiseReject: () => void = () => {};
  // was previous open promise fulfilled
  private wasPrevOpenFulfilled: boolean = false;
  private connectionId?: string;
  private get mqttIo(): MqttIo {
    return this.env.getIo('Mqtt') as any;
  }
  private get closedMsg() {
    return `Connection "${this.props.url}" has been closed`;
  }


  protected willInit = async () => {
    this.openPromise = this.makeOpenPromise();

    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omit(this.props, 'url')
    );

    await this.mqttIo.onMessage((connectionId: string, topic: string, data: string | Uint8Array) => {
      if (connectionId !== this.connectionId) return;

      this.messageEvents.emit(topic, data);
    });

    await this.mqttIo.onClose((connectionId: string) => {
      if (connectionId !== this.connectionId) return;

      this.openPromiseReject();

      this.env.log.error(`Mqtt broker has closed a connection`);
      //this.mqttIo.reConnect(this.connectionId);
    });

    await this.mqttIo.onConnect((connectionId: string) => {
      if (connectionId !== this.connectionId) return;

      this.openPromiseReject();
    });

    await this.mqttIo.onError((connectionId: string, error: Error) => {
      if (connectionId !== this.connectionId) return;

      this.env.log.error(`Mqtt connection "${connectionId}": ${error}`);
    });
  }

  destroy = async () => {
    this.messageEvents.removeAll();

    delete this.openPromise;
    delete this.openPromiseResolve;
    delete this.openPromiseReject;

    await this.end();
  }


  async isConnected(): Promise<boolean> {
    if (!this.connectionId) return false;

    return this.mqttIo.isConnected(this.connectionId);
  }

  async publish(topic: string, data: string | Uint8Array): Promise<void> {
    await this.connectedPromise;

    if (!this.connectionId) {
      throw new Error(`Mqtt driver publish: ${this.closedMsg}`);
    }

    return this.mqttIo.publish(this.connectionId, topic, data);
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

  onMessage(cb: MqttMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  removeMessageListener(handlerId: number) {
    if (!this.connectionId) return;

    this.messageEvents.removeListener(handlerId);
  }


  private makeOpenPromise(): Promise<void> {
    this.wasPrevOpenFulfilled = false;

    return new Promise<void>((resolve, reject) => {
      this.openPromiseResolve = resolve;
      this.openPromiseReject = reject;
    });
  }

}


export default class Factory extends DriverFactoryBase<Mqtt> {
  protected DriverClass = Mqtt;
  protected instanceByPropName = 'url';
}
