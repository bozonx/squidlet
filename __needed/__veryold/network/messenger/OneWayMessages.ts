import Message from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Message';
import System from '../System';
import Messenger from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/Messenger';
import {validateMessage} from '../helpers/helpers';


export default class OneWayMessages {
  private readonly system: System;
  private readonly messenger: Messenger;


  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  init() {

    // TODO: может network должен сначала публиковать события в Events, а здесь уже слушать эти события?

    // listen income messages from remote host and rise them on a local host as local messages
    this.system.network.listenIncome(this.handleIncomeMessages);
  }

  emit(category: string, topic: string, payload?: any) {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }
    else if (!topic) {
      throw new Error(`You have to specify the topic`);
    }

    const message: Message = {
      category,
      topic,
      from: this.system.host.id,
      // send to local host
      to: this.system.host.id,
      payload,
    };

    this.system.events.emit(category, topic, message);
  }

  async send(toHost: string, category: string, topic: string, payload?: any): Promise<void> {
    if (!category) {
      throw new Error(`You have to specify the category`);
    }
    else if (!topic) {
      throw new Error(`You have to specify the topic`);
    }
    const message: Message = {
      category,
      topic,
      from: this.system.host.id,
      to: toHost,
      payload,
    };

    await this.messenger.$sendMessage(message);
  }

  /**
   * Rise all the income messages as local events.
   */
  private handleIncomeMessages = (error: Error | null, message: Message): void => {
    // put error to log
    if (error) return this.system.log.error(error.toString());

    if (!validateMessage(message)) {
      return this.system.log.error(`Incorrect message ${JSON.stringify(message)}`);
    }

    this.system.events.emit(message.category, message.topic, message);
  }

}
