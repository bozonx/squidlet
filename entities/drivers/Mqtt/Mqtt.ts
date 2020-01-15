import DriverBase from 'system/base/DriverBase';
import DriverFactoryBase from 'system/base/DriverFactoryBase';
import MqttIo from 'system/interfaces/io/MqttIo';
import {omitObj} from 'system/lib/objects';
import IndexedEvents from 'system/lib/IndexedEvents';
import {uint8ArrayToAscii} from 'system/lib/serialize';
import IoConnectionManager from 'system/lib/logic/IoConnectionManager';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';


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
    return this.connectionManager.connectedPromise;
  }

  private readonly messageEvents = new IndexedEvents<MqttMessageHandler>();
  // topics which are subscribed and income data of them is binary
  private binarySubscribedTopics: {[index: string]: true} = {};
  //private ioHandlerIndexes: number[] = [];
  private readonly connectionManager: IoConnectionManager;

  private get mqttIo(): MqttIo {
    return this.depsInstances.mqttIo;
  }


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.connectionManager = new IoConnectionManager(this.context, {
      open: () => this.mqttIo.newConnection(this.props.url, omitObj(this.props, 'url')),
      removeListener: (handlerIndex: number) => this.mqttIo.removeListener(handlerIndex),
    });
  }


  init = async () => {
    this.depsInstances.mqttIo = this.context.getIo('Mqtt');

    this.log.info(`... Connecting to MQTT broker: ${this.props.url}`);

    // open a new connection and don't wait while it has been completed
    this.connectionManager.openNewConnection();
  }

  destroy = async () => {
    this.messageEvents.destroy();
    await this.connectionManager.destroy();

    delete this.binarySubscribedTopics;

    if (this.connectionManager.connectionId) {
      this.mqttIo.end(this.connectionManager.connectionId)
        .catch(this.log.error);
    }
  }


  async isConnected(): Promise<boolean> {
    return this.connectionManager.isConnected;

    // if (!this.connectionManager.connectionId) return false;
    // return this.connectionManager.doRequest<boolean>((connectionId: string) => this.mqttIo.isConnected(connectionId));
  }

  async publish(topic: string, data?: string | Uint8Array): Promise<void> {
    // wait for connection for 60 sec and do request
    await this.connectionManager.connectedPromise;

    const preparedData: string | Uint8Array = (typeof data === 'undefined')
      ? new Uint8Array(0)
      : data;

    return this.connectionManager.doRequest<void>(
      (connectionId: string) => this.mqttIo.publish(connectionId, topic, preparedData)
    );
  }

  /**
   * Subscribe to changes at broker
   * @param topic
   * @param isBinary - means that income data will be binary.
   */
  async subscribe(topic: string, isBinary: boolean = false): Promise<void> {
    await this.connectionManager.connectedPromise;

    if (isBinary) {
      this.binarySubscribedTopics[topic] = true;
    }

    return this.connectionManager.doRequest<void>(
      (connectionId: string) => this.mqttIo.subscribe(connectionId, topic)
    );
  }

  async unsubscribe(topic: string): Promise<void> {
    await this.connectionManager.connectedPromise;

    delete this.binarySubscribedTopics[topic];

    return this.connectionManager.doRequest<void>(
      (connectionId: string) => this.mqttIo.unsubscribe(connectionId, topic)
    );
  }

  onMessage(cb: MqttMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  removeListener(handlerId: number) {
    this.messageEvents.removeListener(handlerId);
  }


  private handleIncomeMessage = (topic: string, data: Uint8Array) => {
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

  private handleEnd = () => {
    // TODO: add
    // TODO: remove old events
    this.listenIoEvents()
      .catch(this.log.error);
  }

  private listenIoEvents() {
    // TODO: review - может не нужна ошибка? просто ожидать подключения
    if (!this.connectionManager.connectionId) {
      throw new Error(`No connection id`);
    }

    const connectionId: string = this.connectionManager.connectionId;

    return this.connectionManager.registerListeners([
      () => this.mqttIo.onMessage(connectionId, this.handleIncomeMessage),
      () => this.mqttIo.onDisconnect(connectionId, this.connectionManager.handleDisconnect),
      () => this.mqttIo.onEnd(connectionId, this.handleEnd),
      () => this.mqttIo.onConnect(connectionId, this.connectionManager.handleConnect),
      () => this.mqttIo.onError(connectionId, (error: string) => {
        this.log.error(`Mqtt driver. Connection id "${connectionId}": ${error}`);
      }),
    ]);
  }

}


export default class Factory extends DriverFactoryBase<Mqtt, MqttProps> {
  protected SubDriverClass = Mqtt;
  protected instanceId = (props: MqttProps) => props.url + (props.username || '');
}
