import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {
  WebSocketServer,
  WebSocketServerConnection
} from '../../drivers/WebSocketServer/WebSocketServer';
import categories from '../../../system/dict/categories';


interface BackDoorProps {
  host: string;
  port: number;
}

// TODO: set default host port in manifest
// TODO: listen subscribes which was set by squildetctl - use externalDataOutcome, externalDataIncome

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
    this.env.events.addCategoryListener(categories.logger, (data: any) => {
      // TODO: !!!
    });

    this.env.events.addCategoryListener(categories.updater, (data: any) => {
      // TODO: !!!
    });

    this.env.events.addCategoryListener(categories.ioSet, (data: any) => {
      // TODO: !!!
    });
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
