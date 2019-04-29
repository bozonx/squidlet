import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import categories from 'system/dict/categories';
import {
  WebSocketServer,
  WebSocketServerConnection
} from '../../drivers/WebSocketServer/WebSocketServer';
import IoItem from '../../../system/interfaces/IoItem';


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
    this.env.events.addCategoryListener(categories.logger, (data: any, level: string) => {
      // TODO: !!!
    });

    this.env.events.addCategoryListener(categories.updater, (data: any, topic: string) => {
      // TODO: !!!
    });

    this.env.events.addCategoryListener(categories.ioSet, (data: any) => {
      //const instance: IoItem = this.env.system.ioSet.getInstance(ioName);

      // TODO: call IoSet service

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
