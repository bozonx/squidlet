import ServiceBase from 'system/base/ServiceBase';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionServiceType,
  IncomeMessageHandler,
  StatusHandler
} from 'system/interfaces/Connection';


interface Props {

}


export default class ModbusRtuConnection extends ServiceBase<Props> implements Connection {
  serviceType: ConnectionServiceType = CONNECTION_SERVICE_TYPE;

  init = async () => {
    //this.depsInstances.wsServer = await this.context.getSubDriver('WsServerSessions', this.props);

  }

  destroy = async () => {
  }


  /**
   * Send data to peer and don't wait for response.
   * Port is from 0 and up to 253. Don't use 254 and 255.
   */
  send(port: number, payload: Uint8Array): Promise<void> {

  }

  isConnected(): boolean {
    // TODO: add
  }

  onIncomeMessage(cb: IncomeMessageHandler): number {
    // TODO: add
  }

  onConnect(cb: StatusHandler): number {
    // TODO: add
  }

  onDisconnect(cb: StatusHandler): number {
    // TODO: add
  }

  /**
   * Remove listener of onIncomeData, onConnect or onDisconnect
   */
  removeListener(handlerIndex: number): void {
    // TODO: add
  }

}
