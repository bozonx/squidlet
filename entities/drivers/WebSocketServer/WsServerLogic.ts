import WebSocketClientIo from 'system/interfaces/io/WebSocketClientIo';


export interface WsServerLogicProps {

}


export default class WsServerLogic {
  private readonly wsServerIo: WebSocketClientIo;
  private readonly props: WsServerLogicProps;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;

  constructor(
    wsServerIo: WebSocketClientIo,
    props: WsServerLogicProps,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.wsServerIo = wsServerIo;
    this.props = props;
    this.logInfo = logInfo;
    this.logError = logError;
  }
}
