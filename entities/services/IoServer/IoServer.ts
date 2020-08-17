import ServiceBase from 'system/base/ServiceBase';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {deserializeJson, serializeJson} from 'system/lib/serialize';
import {removeItemFromArray} from 'system/lib/arrays';
import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';
import WebSocketServerIo from '../../../system/interfaces/io/WebSocketServerIo';
import WsServerLogic from '../../drivers/WsServer/WsServerLogic';


export default class IoServer extends ServiceBase<WsServerSessionsProps> {
  init = async () => {
    //this.depsInstances.wsServer = await this.context.getSubDriver('WsServerSessions', this.props);

    // TODO: для http api нужно передать свое api

    this.log.info('--> Initializing websocket io servers');
    await this.initWsIoServer();
  }

  destroy = async () => {
  }



  private async initWsIoServer() {
    if (!this.hostConfig.ioServer) {
      throw new Error(`Can't init ioServer because it isn't allowed in a host config`);
    }

    const wsServerIo = this.ioSet.getIo<WebSocketServerIo>('WebSocketServer');
    const props = this.hostConfig.ioServer;

    this._wsServer = new WsServerLogic(
      wsServerIo,
      props,
      () => this.log.error(`Websocket server has been closed`),
      this.log.debug,
      this.log.info,
      this.log.error,
    );

    await this.wsServer.init();

    this.wsServer.onMessage((connectionId: string, data: string | Uint8Array) => {
      if (!this.ioConnection) {
        return this.log.error(`IoServer.onMessage: no ioConnection`);
      }

      this.ioConnection.incomeMessage(connectionId, data)
        .catch(this.log.error);
    });
    this.wsServer.onConnection((connectionId: string) => {
      this.handleNewIoClientConnection(connectionId)
        .catch(this.log.error);
    });
    this.wsServer.onConnectionClose(() => {
      this.handleIoClientCloseConnection()
        .catch(this.log.error);
    });
  }

}
