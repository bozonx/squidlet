import Connection from '../squidlet-networking/src/interfaces/__old/Connection';
import IndexedEvents from '../squidlet-lib/src/IndexedEvents';

import {PORT_EXPANDER_FEEDBACK} from '../../../../../../../../../../mnt/disk2/workspace/squidlet/__old/plugins/portExpander/services/IoSetPortExpander/constants.js';


type IncomeMessageHandler = (feedbackNum: number, args: Uint8Array) => void;


// TODO: does it need ???

export default class ExpanderFunctionCall {
  // TODO: does it need ???
  private messageEvents = new IndexedEvents<IncomeMessageHandler>();
  private readonly connection: Connection;


  constructor(connection: Connection) {
    this.connection = connection;

    this.connection.onConnect(this.handleConnect);
    this.connection.onDisconnect(this.handleDisconnect);
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
    await this.connection.send(funcNum, args);
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


  private handleConnect() {
    // TODO: what to do ????
  }

  private handleDisconnect() {
    // TODO: what to do ????
  }

  private handleIncomeMessages(port: number, payload: Uint8Array) {
    this.messageEvents.emit(port, payload);
  }

}
