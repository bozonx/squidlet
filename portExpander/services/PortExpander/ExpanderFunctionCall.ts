import Connection from '../../../system/interfaces/Connection';


type IncomeMessageHandler = (funcNum: number, args: Uint8Array) => void;


export default class ExpanderFunctionCall {
  private readonly connection: Connection;
  // we work only with one peer
  private activePeerId?: string;


  constructor(connection: Connection) {
    this.connection = connection;

    // TODO: как получить peer если он уже был приконекчен ????
    this.connection.onPeerConnect(this.handlePeerConnect);
    this.connection.onPeerDisconnect(this.handlePeerDisconnect);
    this.connection.onIncomeMessage(this.handleIncomeMessages);
  }

  destroy() {
  }


  onMessage(cb: IncomeMessageHandler): number {
    // TODO: add
    // TODO: возвращается только args без доп данных
  }

  removeListener(handlerIndex: number) {
    // TODO: add
  }

  callFunc(funcNum: number, args: Uint8Array) {
    // TODO: add
  }

  request(
    funcNum: number,
    feedbackNum: number,
    feedbackData: Uint8Array
  ): Promise<Uint8Array> {
    // TODO: add
    // TODO: возвращается только args без доп данных
  }


  private handlePeerConnect(peerId: string) {
    this.activePeerId = peerId;
  }

  private handlePeerDisconnect() {
    // TODO: what to do ????
  }

  private handleIncomeMessages(peerId: string, port: number, payload: Uint8Array) {
    // TODO: add
  }

}
