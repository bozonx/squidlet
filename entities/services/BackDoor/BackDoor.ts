import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {
  WebSocketServer,
  WebSocketServerConnection,
  WebSocketServerDriverProps
} from '../../drivers/WebSocketServer/WebSocketServer';


interface BackDoorProps {
  host: string;
  port: number;
}

// TODO: set default host port

export default class BackDoor extends ServiceBase<BackDoorProps> {
  private get wsServerDriver(): WebSocketServer {
    return this.depsInstances.wsServerDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServerDriver = await getDriverDep('WebSocketServer')
      .getInstance({
        ...this.props,
        binary: true,
      });

    this.wsServerDriver.onConnection((connection: WebSocketServerConnection) => {
      connection.onIncomeMessage((message: {[index: string]: any}) => {
        this.onIncomeMessage(connection.clientId, message as Uint8Array);
      });
    });

    this.listenSystemEvents();
  }


  private listenSystemEvents() {
    // TODO: listen logger
    // TODO: listen ioSet
    // TODO: listen subscribes which was set by squildetctl

    //this.env.events.addCategoryListener();
  }

  private onIncomeMessage(clientId: string, message: Uint8Array) {
    // TODO: parse message
  }

  private onIncomeEntityUpdate() {

  }

  private onIncomeConfigsUpdate() {

  }

  private onIncomeSystemUpdate() {

  }

  private onIncomePub() {

  }

  private onIncomeAddSub() {

  }

  private onIncomeIoCall() {

  }

}
