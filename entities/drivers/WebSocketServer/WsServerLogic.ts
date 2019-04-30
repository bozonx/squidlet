import WebSocketServerIo from 'system/interfaces/io/WebSocketServerIo';


// TODO: extend of driver's props
export interface WsServerLogicProps {
  host: string;
  port: number;
}


export default class WsServerLogic {
  private readonly wsServerIo: WebSocketServerIo;
  private readonly props: WsServerLogicProps;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private readonly serverId: string;

  constructor(
    wsServerIo: WebSocketServerIo,
    props: WsServerLogicProps,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsServerIo = wsServerIo;
    this.props = props;
    this.logInfo = logInfo;
    this.logError = logError;

    this.serverId = this.wsServerIo.newServer({
      host: this.props.host,
      port: this.props.port,
    });


  }


}
