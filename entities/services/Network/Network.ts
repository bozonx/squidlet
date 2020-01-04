import ServiceBase from '../../../system/base/ServiceBase';
import NetworkDriver from '../../../system/interfaces/NetworkDriver';


interface NetworkInterface {
  // driver name like: 'SerialNetwork' etc
  driver: string;
  busId: string | number;
  // props of driver
  [index: string]: any;
}

interface Props {
  interfaces: NetworkInterface[];
}


export default class Network extends ServiceBase<Props> {
  // driver instances by index of props.interfaces
  private drivers: NetworkDriver[] = [];


  init = async () => {
    // TODO: make drivers instance
    // TODO: десерилизовать полное сообщение с hostId и данными для RemoteCall
    // TODO: слушать входищие сообщения драйверов и передавать на роутер
    // TODO: то что на наш хост - выполнить
  }

  destroy = async () => {
    // TODO: add
  }

}
