import ServiceBase from '../../app/entities/ServiceBase';
import {GetDriverDep} from '../../app/entities/EntityBase';
import {MqttDriver} from './Mqtt.driver';


interface Props {
  protocol?: string;
  host?: string;
  port?: string;
}

export default class Mqtt extends ServiceBase<Props> {
  private get mqttDriver(): MqttDriver {
    return this.depsInstances.digitalInput as MqttDriver;
  }

  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.mqttDriver = await getDriverDep('Mqtt.driver')
      .getInstance(this.props);
  }

  // protected didInit = async () => {
  //   this.digitalInput.addListener(this.listenHandler, this.props.debounce);
  // }


}
