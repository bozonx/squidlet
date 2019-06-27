import ServiceBase from 'system/baseServices/ServiceBase';
import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {GetDriverDep} from 'system/entities/EntityBase';
import {Mqtt} from '../../drivers/Mqtt/Mqtt';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

const REMOTE_CALL_TOPIC = 'remoteCall';


export default class MqttApi extends ServiceBase<Props> {
  // infinity session
  private sessionId: string = '';
  private get mqtt(): Mqtt {
    return this.depsInstances.mqtt;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqtt = await getDriverDep('Mqtt')
      .getInstance(this.props);

    this.sessionId = this.env.system.sessions.newSession(0);
  }

  protected didInit = async () => {
    // listen to income messages from mqtt broker
    await this.mqtt.onMessage(this.handleIncomeMessages);

    // listen outcome api requests
    this.env.api.onOutcomeRemoteCall(this.handleOutcomeMessages);
  }

  protected devicesDidInit = async () => {
    await this.subscribeToTopic();
  }

  destroy = async () => {
    this.env.system.sessions.shutDownImmediately(this.sessionId);
  }


  /**
   * Processing income messages from broker
   */
  private handleIncomeMessages = this.wrapErrors(async (topic: string, data: string | Uint8Array) => {
    // TODO: use host prefix
    if (topic !== this.makeTopic()) return;

    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.env.log.error(`MqttApi: Can't decode message: ${err}`);
    }

    return this.env.api.incomeRemoteCall(this.sessionId, msg);
  });

  private handleOutcomeMessages = this.wrapErrors(async (sessionId: string, message: RemoteCallMessage) => {
    if (sessionId !== this.sessionId) return;

    const binData: Uint8Array = serializeJson(message);

    return this.mqtt.publish(this.makeTopic(), binData);
  });

  /**
   * Subscribe to all the device's actions calls on broker
   */
  private subscribeToTopic = async () => {
    this.env.log.info(`--> Register MQTT subscriber of remote call api topic`);

    await this.mqtt.subscribe(this.makeTopic());
  }

  private makeTopic(): string {
    // TODO: use host prefix

    return REMOTE_CALL_TOPIC;
  }

}
