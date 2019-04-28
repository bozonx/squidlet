import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';
import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';


export interface WebSocketClientProps {

}

export class WebSocketClient extends DriverBase<WebSocketClientProps> {
  private get wsClientIo(): WebSocketClientIo {
    return this.env.getIo('WebSocketClient') as any;
  }

  protected willInit = async () => {
  }



}

export default class Factory extends DriverFactoryBase<WebSocketClient> {
  protected DriverClass = WebSocketClient;

  // TODO: what to use?
  // protected instanceIdCalc = (props: {[index: string]: any}): string => {
  //   return String(props.uartNum);
  // }
}
