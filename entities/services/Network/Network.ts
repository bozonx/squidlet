import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import Connections from './Connections';
import Router from './Router';
import NetworkMessage from './interfaces/NetworkMessage';


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
  private readonly connections: Connections;
  private readonly router: Router;


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.connections = new Connections();
    this.router = new Router(this.connections);
  }


  init = async () => {
    // TODO: десерилизовать полное сообщение с hostId и данными для RemoteCall
    // TODO: слушать входищие сообщения драйверов и передавать на роутер
    // TODO: то что на наш хост - выполнить

    this.router.init();
    this.router.onIncomeDestMessage(this.handleIncomeMessage);
  }

  destroy = async () => {
    this.router.destroy();
    this.connections.destroy();
  }


  private handleIncomeMessage(message: NetworkMessage) {

  }

}
