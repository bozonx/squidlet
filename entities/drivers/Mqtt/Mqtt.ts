import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {omitObj} from 'system/lib/objects';
import IndexedEvents from 'system/lib/IndexedEvents';
import Promised from 'system/lib/Promised';
import {uint8ArrayToUtf8Text} from '../../../system/lib/serialize';


type MqttMessageHandler = (topic: string, data: string | Uint8Array) => void;

export interface MqttProps {
  url: string;
}


export class Mqtt extends DriverBase<MqttProps> {
  // TODO: проверить что будет переподключаться до бесконечности

  // on first time connect or reconnect
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


  // TODO: review
  init = async () => {
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

    await this.mqttIo.onError((connectionId: string, error: Error) => {
      if (connectionId !== this.connectionId) return;

      this.log.error(`Mqtt driver. Connection id "${connectionId}": ${error}`);
    });

    this.connectionId = await this.mqttIo.newConnection(
      this.props.url,
      omitObj(this.props, 'url')
    );

    // TODO: remove
    // wait for connection established
    await this.connectedPromise;
  }

  destroy = async () => {
    this.messageEvents.destroy();
    this.openPromise && this.openPromise.destroy();

    delete this.openPromise;
    delete this.binarySubscribedTopics;

    if (this.connectionId) {
      await this.mqttIo.end(this.connectionId);
    }
  }


  async isConnected(): Promise<boolean> {
    if (!this.connectionId) return false;

    return this.mqttIo.isConnected(this.connectionId);
  }

  async publish(topic: string, data?: string | Uint8Array): Promise<void> {
    let preparedData: string | Uint8Array;

    if (typeof data === 'undefined') {
      preparedData = new Uint8Array(0);
    }
    else {
      preparedData = data;
    }

    await this.connectedPromise;

    if (!this.connectionId) {
      throw new Error(`Mqtt driver publish: ${this.closedMsg}`);
    }

    return this.mqttIo.publish(this.connectionId, topic, preparedData);
  }

  /**
   * Subscribe to changed at brocker
   * @param topic
   * @param isBinary - means that income data will be binary.
   */
  async subscribe(topic: string, isBinary: boolean = false): Promise<void> {
    await this.connectedPromise;

    if (!this.connectionId) {
      throw new Error(`Mqtt driver subscribe: ${this.closedMsg}`);
    }

    if (isBinary) {
      this.binarySubscribedTopics[topic] = true;
    }

    return this.mqttIo.subscribe(this.connectionId, topic);
  }

  async unsubscribe(topic: string): Promise<void> {
    await this.connectedPromise;

    if (!this.connectionId) {
      throw new Error(`Mqtt driver subscribe: ${this.closedMsg}`);
    }

    delete this.binarySubscribedTopics[topic];

    return this.mqttIo.unsubscribe(this.connectionId, topic);
  }

  onMessage(cb: MqttMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  removeListener(handlerId: number) {
    this.messageEvents.removeListener(handlerId);
  }


  private handleIncomeMessage = (connectionId: string, topic: string, data: Uint8Array) => {
    if (connectionId !== this.connectionId) return;

    let preparedData: string | Uint8Array = data;

    if (!this.binarySubscribedTopics[topic]) {
      // make string
      preparedData = uint8ArrayToUtf8Text(data);
    }

    console.log(11111111, preparedData)

    this.messageEvents.emit(topic, preparedData);
  }

  private handleClose = (connectionId: string) => {
    if (connectionId !== this.connectionId) return;

    const msg = `Mqtt broker has closed a connection`;

    this.openPromise && this.openPromise.reject(new Error(msg));

    this.log.error(msg);
  }

}


export default class Factory extends DriverFactoryBase<Mqtt, MqttProps> {
  protected SubDriverClass = Mqtt;
  protected instanceId = (props: MqttProps) => props.url;
}
