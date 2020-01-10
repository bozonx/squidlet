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
  /**
   * It represents that it has connectionId and IO is connected to broker.
   * On disconnect it will be recreated.
   */
  get connectedPromise(): Promise<void> {
    return this.openPromised.promise;
  }

  private readonly messageEvents = new IndexedEvents<MqttMessageHandler>();
  private openPromised = new Promised<void>();
  // was previous open promise fulfilled
  //private wasPrevOpenFulfilled: boolean = false;
  private connectionId?: string;
  // topics which are subscribed and income data of them is binary
  private binarySubscribedTopics: {[index: string]: true} = {};

  private get mqttIo(): MqttIo {
    return this.context.getIo('Mqtt') as any;
  }


  init = async () => {
    // open a new connection and don't wait while it has been completed
    this.openNewConnection();
  }

  destroy = async () => {
    this.messageEvents.destroy();
    this.openPromised.destroy();

    delete this.openPromised;
    delete this.binarySubscribedTopics;

    if (this.connectionId) {
      this.mqttIo.end(this.connectionId)
        .catch(this.log.error);
    }
  }


  async isConnected(): Promise<boolean> {
    if (!this.connectionId) return false;

    // TODO: лучше ориентироваться на событие onConnect

    return this.doRequest<boolean>((connectionId: string) => this.mqttIo.isConnected(connectionId));
  }

  async publish(topic: string, data?: string | Uint8Array): Promise<void> {
    // wait for connection for 60 sec and do request
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


  private handleIncomeMessage = (connectionId: string, topic: string, data: Uint8Array) => {
    // process only ours messages
    if (connectionId !== this.connectionId) return;

    let preparedData: string | Uint8Array;

    if (this.binarySubscribedTopics[topic]) {
      // use binary as is
      preparedData = data;
    }
    else {
      // make ascii string
      preparedData = (data.length) ? uint8ArrayToAscii(data) : '';
    }

    this.messageEvents.emit(topic, preparedData);
  }

  private handleDisconnect = (connectionId: string) => {
    if (connectionId !== this.connectionId) return;

    // reject open promise if it hasn't been fulfilled
    if (!this.openPromised.isFulfilled()) {
      this.openPromised.reject(new Error(`Mqtt: Disconnected ${connectionId}`));
    }
    // make new open promise
    this.openPromised = new Promised<void>();

    // TODO: what to do next ????
  }

  private handleEnd = (connectionId: string) => {
    // TODO: add
  }

  private doRequest<T>(cb: (connectionId: string) => Promise<T>): Promise<T> {
    // TODO: лучше переподписаться на события заного, отписаться от старых
    // TODO: см code 1001 и делать переконнект если указанно
  }

  private openNewConnection() {
    //this.openPromise = new Promised<void>();

    this.log.info(`... Connecting to MQTT broker: ${this.props.url}`);

    // TODO: если не удалось подписаться то продолжать это делать через несколько секунд
    this.establishConnection()
      .catch(this.log.error);
  }

  async establishConnection() {
    // TODO: remove old events
    await this.listenIoEvents();

    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omitObj(this.props, 'url')
    );
  }

  async listenIoEvents() {
    // TODO: если не получилось сделать за раз - то отписаться

    const handlers: number[] = [];

    handlers.push(await this.mqttIo.onMessage(this.handleIncomeMessage));
    handlers.push(await this.mqttIo.onDisconnect(this.handleDisconnect));
    handlers.push(await this.mqttIo.onEnd(this.handleEnd));

    // TODO: таймаут если не удалось соединиться за 60 сек - переконекчиваться
    //  - возможно это уже реализованно в самам mqtt
    //  - бесконечный цикл переконекта при первом подсоединении и при последующих обрывах связи
    handlers.push(await this.mqttIo.onConnect((connectionId: string) => {
      if (connectionId !== this.connectionId) return;

      this.openPromise && this.openPromise.resolve();
    }));

    handlers.push(await this.mqttIo.onError((connectionId: string, error: string) => {
      if (connectionId !== this.connectionId) return;

      this.log.error(`Mqtt driver. Connection id "${connectionId}": ${error}`);
    }));
  }

}


export default class Factory extends DriverFactoryBase<Mqtt, MqttProps> {
  protected SubDriverClass = Mqtt;
  protected instanceId = (props: MqttProps) => props.url + (props.username || '');
}
