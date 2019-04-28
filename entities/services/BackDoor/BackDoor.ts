import ServiceBase from 'system/baseServices/ServiceBase';
import WebSocketClientIo from '../../../system/interfaces/io/WebSocketClientIo';


interface Props {
}


export default class BackDoor extends ServiceBase<Props> {
  // TODO: use driver
  private get storageIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }


  protected didInit = async () => {
  }


}
