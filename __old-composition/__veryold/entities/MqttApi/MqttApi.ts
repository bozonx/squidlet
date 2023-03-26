import ServiceBase from 'base/ServiceBase';
import {deserializeJson, serializeJson} from 'lib/serialize';
import RemoteCallMessage from 'interfaces/RemoteCallMessage';
import {Mqtt, MqttProps} from '../../../../../squidlet-networking/src/drivers/Mqtt/Mqtt';


const REMOTE_CALL_TOPIC = 'remoteCall';


export default class MqttApi extends ServiceBase<MqttProps> {
  // infinity session
  private sessionId: string = '';
  private get mqtt(): Mqtt {
    return this.depsInstances.mqtt;
  }


  init = async () => {
    this.depsInstances.mqtt = await this.context.getSubDriver('Mqtt', this.props);

    this.sessionId = this.context.sessions.newSession(0);

    // listen to income messages from mqtt broker
    await this.mqtt.onMessage(this.handleIncomeMessages);
    // listen outcome api requests
    this.context.system.apiManager.onOutcomeRemoteCall(this.handleOutcomeMessages);
  }

  protected async devicesDidInit() {
    await this.subscribeToTopic();
  }

  destroy = async () => {
    this.context.sessions.destroySession(this.sessionId);
  }


  /**
   * Processing income messages from MQTT broker
   */
  private handleIncomeMessages = this.wrapErrors(async (topic: string, data: string | Uint8Array) => {
    if (topic !== this.makeTopic()) return;

    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.log.error(`MqttApi: Can't decode message: ${err}`);
    }

    return this.context.system.apiManager.incomeRemoteCall(this.sessionId, msg);
  });

  private handleOutcomeMessages = this.wrapErrors(async (sessionId: string, message: RemoteCallMessage) => {
    if (sessionId !== this.sessionId) return;

    const binData: Uint8Array = serializeJson(message);

    return this.mqtt.publish(this.makeTopic(), binData);
  });

  /**
   * Subscribe to remoteCall topic
   */
  private subscribeToTopic = async () => {
    this.log.info(`--> Register MQTT subscriber of remote call api topic`);

    await this.mqtt.subscribe(this.makeTopic());
  }

  private makeTopic(): string {
    // TODO: use host id prefix

    return REMOTE_CALL_TOPIC;
  }

}
