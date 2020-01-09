import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {omitObj} from 'system/lib/objects';
import IndexedEvents from 'system/lib/IndexedEvents';
import Promised from 'system/lib/Promised';
import {uint8ArrayToAscii} from 'system/lib/serialize';


type MqttMessageHandler = (topic: string, data: string | Uint8Array) => void;

export interface MqttProps {
  url: string;
  username?: string;
  password?: string;
}


export class Mqtt extends DriverBase<MqttProps> {
  // TODO: review
  /**
   * It represents that it has connectionId and IO is connected to broker
   */
  get connectedPromise(): Promise<void> {
    if (!this.connectionId || !this.openPromise) {
      throw new Error(`Mqtt.connectedPromise: ${this.closedMsg}`);
    }

    return this.openPromise.promise;
  }

  private readonly messageEvents = new IndexedEvents<MqttMessageHandler>();
  private openPromise?: Promised<void>;
  // was previous open promise fulfilled
  //private wasPrevOpenFulfilled: boolean = false;
  private connectionId?: string;
  // topics which are subscribed and income data of them is binary
  private binarySubscribedTopics: {[index: string]: true} = {};

  private get mqttIo(): MqttIo {
    return this.context.getIo('Mqtt') as any;
  }

  private get closedMsg() {
    return `Connection "${this.props.url}" has been closed`;
  }


  init = async () => {
    this.openNewConnection();
  }

  destroy = async () => {
    this.messageEvents.destroy();
    this.openPromise && this.openPromise.destroy();

    delete this.openPromise;
    delete this.binarySubscribedTopics;

    if (this.connectionId) {
      this.mqttIo.end(this.connectionId)
        .catch(this.log.error);
    }
  }


  async isConnected(): Promise<boolean> {
    if (!this.connectionId) return false;

    return this.doRequest<boolean>((connectionId: string) => this.mqttIo.isConnected(connectionId));
  }

  async publish(topic: string, data?: string | Uint8Array): Promise<void> {
    await this.connectedPromise;

    const preparedData: string | Uint8Array = (typeof data === 'undefined')
      ? new Uint8Array(0)
      : data;

    return this.doRequest<void>(
      (connectionId: string) => this.mqttIo.publish(connectionId, topic, preparedData)
    );
  }

  /**
   * Subscribe to changes at broker
   * @param topic
   * @param isBinary - means that income data will be binary.
   */
  async subscribe(topic: string, isBinary: boolean = false): Promise<void> {
    await this.connectedPromise;

    if (isBinary) {
      this.binarySubscribedTopics[topic] = true;
    }

    return this.doRequest<void>(
      (connectionId: string) => this.mqttIo.subscribe(connectionId, topic)
    );
  }

  async unsubscribe(topic: string): Promise<void> {
    await this.connectedPromise;

    delete this.binarySubscribedTopics[topic];

    return this.doRequest<void>(
      (connectionId: string) => this.mqttIo.unsubscribe(connectionId, topic)
    );
  }

  onMessage(cb: MqttMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  removeListener(handlerId: number) {
    this.messageEvents.removeListener(handlerId);
  }


  // TODO: review
  private handleIncomeMessage = (connectionId: string, topic: string, data: Uint8Array) => {
    if (connectionId !== this.connectionId) return;

    let preparedData: string | Uint8Array = data;

    if (!this.binarySubscribedTopics[topic]) {
      // make ascii string
      preparedData = (data.length) ? uint8ArrayToAscii(data) : '';
    }

    this.messageEvents.emit(topic, preparedData);
  }

  // TODO: review
  private handleClose = (connectionId: string) => {
    if (connectionId !== this.connectionId) return;

    const msg = `Mqtt broker has closed a connection`;

    this.openPromise && this.openPromise.reject(new Error(msg));

    this.log.error(msg);
  }

  private doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    // TODO: лучше переподписаться на события заного, отписаться от старых
    // TODO: см code 1001 и делать переконнект если указанно
  }

  private openNewConnection() {
    this.openPromise = new Promised<void>();

    this.log.info(`... Connecting to MQTT broker: ${this.props.url}`);
    await this.mqttIo.onMessage(this.handleIncomeMessage);
    await this.mqttIo.onClose(this.handleClose);

    // TODO: таймаут если не удалось соединиться за 60 сек - переконекчиваться
    //  - возможно это уже реализованно в самам mqtt
    //  - бесконечный цикл переконекта при первом подсоединении и при последующих обрывах связи
    await this.mqttIo.onConnect((connectionId: string) => {
      if (connectionId !== this.connectionId) return;

      this.openPromise && this.openPromise.resolve();
    });

    await this.mqttIo.onError((connectionId: string, error: string) => {
      if (connectionId !== this.connectionId) return;

      this.log.error(`Mqtt driver. Connection id "${connectionId}": ${error}`);
    });

    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omitObj(this.props, 'url')
    );
  }

}


export default class Factory extends DriverFactoryBase<Mqtt, MqttProps> {
  protected SubDriverClass = Mqtt;
  protected instanceId = (props: MqttProps) => props.url + (props.username || '');
}
