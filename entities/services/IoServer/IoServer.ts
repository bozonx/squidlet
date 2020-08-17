import ServiceBase from 'system/base/ServiceBase';
import {WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';
import WebSocketServerIo from '../../../system/interfaces/io/WebSocketServerIo';
import WsServerLogic from '../../drivers/WsServer/WsServerLogic';
import IoServerConnectionLogic from './IoServerConnectionLogic';


export default class IoServer extends ServiceBase<WsServerSessionsProps> {
  private wsServer!: WsServerLogic;
  private ioConnection?: IoServerConnectionLogic;


  init = async () => {
    this.log.info('--> Initializing websocket io servers');

    await this.initWsServer();

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

  destroy = async () => {
    this.log.info('... destroying IoServer');
    this.ioConnection && await this.ioConnection.destroy();
    await this.wsServer.destroy();

    delete this.ioConnection;
  }


  private async initWsServer() {
    if (!this.context.config.ioServer) {
      throw new Error(`Can't init ioServer because it isn't allowed in a host config`);
    }

    const wsServerIo = this.context.getIo<WebSocketServerIo>('WebSocketServer');
    const props = this.context.config.ioServer;

    this.wsServer = new WsServerLogic(
      wsServerIo,
      props,
      () => this.log.error(`Websocket server has been closed`),
      this.log.debug,
      this.log.info,
      this.log.error,
    );

    await this.wsServer.init();

  }

  private handleNewIoClientConnection = async (connectionId: string) => {
    if (this.ioConnection) {
      const msg = `Only one connection is allowed`;

      this.log.error(msg);
      await this.wsServer.closeConnection(connectionId, 1, msg);

      return;
    }

    this.ioConnection = new IoServerConnectionLogic(
      connectionId,
      this.context,
      this.wsServer.send,
      this.log.debug,
      this.log.error
    );

    this.ioConnection.setReadyState();

    this.log.info(`New IO client has been connected`);
  }

  private handleIoClientCloseConnection = async () => {
    this.ioConnection && await this.ioConnection.destroy();

    delete this.ioConnection;

    this.log.info(`IO client has been disconnected`);
  }

}
