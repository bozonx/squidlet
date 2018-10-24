import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDev} from '../../../../platforms/squidlet-rpi/dev/Mqtt.dev';


interface Props {
  protocol: string;
  host: string;
  port: string;
}

export default class Mqtt extends ServiceBase<Props> {
  private get mqttDev(): MqttDev {
    return this.depsInstances.mqttDev as MqttDev;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqttDev = await getDriverDep('Mqtt.dev')
      .connect(this.props);
    // this.depsInstances.mqttDriver = await getDriverDep('Mqtt.driver')
    //   .getInstance(this.props);
  }

  protected didInit = async () => {
    this.mqttDev.onMessage(this.messagesHandler);
  }

  protected destroy = () => {
    // TODO: remove listener
  }


  private messagesHandler = (topic: string, data: string) => {
    // TODO: ! формируем специальное сообщение в messanger

  }

}
