import CategorizedEvents from 'system/helpers/CategorizedEvents';
import {makeMessage} from './helpers';
import {BACKDOOR_ACTION, BACKDOOR_MSG_TYPE} from './Backdoor';


// category, topic, data
export type EventPayload = [string, (string | undefined), (any | undefined)];

enum HANDLER_ITEM_POS {
  category,
  topic,
  handlerIndex
}

// see HANDLER_ITEM_POS
type EventHandlerItem = [string, (string | undefined), number];


export default class MainEvents {
  private readonly eventHandlers: {[index: string]: EventHandlerItem[]} = {};
  private readonly events: CategorizedEvents;


  constructor(events: CategorizedEvents) {
    this.events = events;
  }


  /**
   * Listen to event of common event system
   * and send it to backdoor client which has been subscribed to this event.
   */
  private startListenEvents(sessionId: string, category: string, topic?: string) {
    let handlerIndex: number;

    if (topic) {
      handlerIndex = this.events.addListener(category, topic, (data: any) => {
        return this.sendEventResponseMessage(sessionId, category, topic, data);
      });
    }
    else {
      handlerIndex = this.events.addCategoryListener(category, (data: any) => {
        return this.sendEventResponseMessage(sessionId, category, undefined, data);
      });
    }

    const EventHandlerItem: EventHandlerItem = [category, topic, handlerIndex];

    if (!this.eventHandlers[sessionId]) this.eventHandlers[sessionId] = [];

    this.eventHandlers[sessionId].push(EventHandlerItem);
  }

  private async sendEventResponseMessage(sessionId: string, category: string, topic?: string, data?: any) {
    const payload: EventPayload = [ category, topic, data ];
    const binData: Uint8Array = makeMessage(
      BACKDOOR_MSG_TYPE.send,
      BACKDOOR_ACTION.listenerResponse,
      payload
    );

    try {
      await this.wsServerSessions.send(sessionId, binData);
    }
    catch (err) {
      this.env.log.error(`Backdoor: send error: ${err}`);
    }
  }

  /**
   * Remove all the event handlers of session.
   */
  private removeSessionHandlers(sessionId: string) {
    if (!this.eventHandlers[sessionId]) return;

    for (let eventHandlerItem of this.eventHandlers[sessionId]) {
      const category: string = eventHandlerItem[HANDLER_ITEM_POS.category];
      const topic: string | undefined = eventHandlerItem[HANDLER_ITEM_POS.topic];
      const handlerIndex: number = eventHandlerItem[HANDLER_ITEM_POS.handlerIndex];

      if (topic) {
        this.events.removeListener(category, topic, handlerIndex);
      }
      else {
        this.events.removeCategoryListener(category, handlerIndex);
      }
    }

    delete this.eventHandlers[sessionId];
  }

}
