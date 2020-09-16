import Connection from '../../../system/interfaces/Connection';
import {PORT_EXPANDER_FEEDBACK} from './constants';
import IndexedEvents from '../../../system/lib/IndexedEvents';


type IncomeMessageHandler = (feedbackNum: number, args: Uint8Array) => void;


export default class ExpanderFunctionCall {
  private messageEvents = new IndexedEvents<IncomeMessageHandler>();
  private readonly connection: Connection;
  // we work only with one peer
  private activePeerId?: string;


  constructor(connection: Connection) {
    this.connection = connection;

    // TODO: как получить peer если он уже был приконекчен ????
    // TODO: если это общий Ws server ??? могут быть несколько peer
    this.connection.onPeerConnect(this.handlePeerConnect);
    this.connection.onPeerDisconnect(this.handlePeerDisconnect);
    this.connection.onIncomeMessage(this.handleIncomeMessages);
  }

  destroy() {
    this.messageEvents.destroy();
  }


  onMessage(cb: IncomeMessageHandler): number {
    return this.messageEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.messageEvents.removeListener(handlerIndex);
  }

  async callFunc(funcNum: number, args: Uint8Array) {
    if (!this.activePeerId) {
      throw new Error(`ExpanderFunctionCall: No peer to send`);
    }

    await this.connection.send(this.activePeerId, funcNum, args);
  }

  async request(
    funcNum: number,
    feedbackNum: number,
    funcArgs: Uint8Array
  ): Promise<Uint8Array> {
    await this.callFunc(funcNum, funcArgs);

    return new Promise((resolve, reject) => {
      const handlerIndex = this.onMessage((feedbackNum: number, args: Uint8Array) => {
        if (funcNum !== PORT_EXPANDER_FEEDBACK.digitalInputRead) return;

        this.removeListener(handlerIndex);

        resolve(args);
      });

      // TODO: add timeout
    });
  }


  private handlePeerConnect(peerId: string) {
    this.activePeerId = peerId;
  }

  private handlePeerDisconnect() {
    // TODO: what to do ????
  }

  private handleIncomeMessages(peerId: string, port: number, payload: Uint8Array) {
    // TODO: !!!! что делать с peerId ???
    this.messageEvents.emit(port, payload);
  }

}
