import Router from './Router';
import Message from './interfaces/Message';
import Messenger from './Messenger';


/**
 * Subscribe to remote host's events
 */
export default class Bridge {
  private readonly messenger: Messenger;

  constructor(messenger: Messenger) {
    this.messenger = messenger;
  }

  subscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    // TODO: !!!

  }

  unsubscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    // TODO: !!!
  }

}
