import CategorizedEvents from 'helpers/CategorizedEvents';
import {makeMessage} from '../../entities/services/Backdoor/helpers';
import {BACKDOOR_ACTION, BACKDOOR_MSG_TYPE} from '../../entities/services/Backdoor/Backdoor';


// category, topic, data
export type EventPayload = [string, (string | undefined), (any | undefined)];

enum HANDLER_ITEM_POS {
  category,
  topic,
  handlerIndex
}

// see HANDLER_ITEM_POS
type EventHandlerItem = [string, (string | undefined), number];


export default class MainEventsServer {
  private readonly events: CategorizedEvents;
  private readonly wsServerSessionsSend: (sessionId: string, data: string | Uint8Array) => Promise<void>;
  private readonly logError: (msg: string) => void;
  private readonly eventHandlers: {[index: string]: EventHandlerItem[]} = {};


  constructor(
    events: CategorizedEvents,
    wsServerSessionsSend: (sessionId: string, data: string | Uint8Array) => Promise<void>,
    logError: (msg: string) => void
  ) {
    this.events = events;
    this.wsServerSessionsSend = wsServerSessionsSend;
    this.logError = logError;
  }

  destroy() {
    // remove all the handlers
    for (let sessionId of Object.keys(this.eventHandlers)) {
      this.removeSessionHandlers(sessionId);
    }
  }


  emit(eventPayload: EventPayload) {
    this.events.emit(eventPayload[0], eventPayload[1], eventPayload[2]);
  }

  /**
   * Listen to event of common event system
   * and send it to backdoor client which has been subscribed to this event.
   */
  startListenEvents(sessionId: string, eventPayload: EventPayload) {
    const category = eventPayload[0];
    const topic = eventPayload[1];
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

  /**
   * Remove all the event handlers of session.
   */
  removeSessionHandlers(sessionId: string) {
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


  private async sendEventResponseMessage(sessionId: string, category: string, topic?: string, data?: any) {
    const payload: EventPayload = [ category, topic, data ];
    const binData: Uint8Array = makeMessage(
      BACKDOOR_MSG_TYPE.send,
      BACKDOOR_ACTION.listenerResponse,
      payload
    );

    try {
      await this.wsServerSessionsSend(sessionId, binData);
    }
    catch (err) {
      this.logError(`Backdoor: send error: ${err}`);
    }
  }

}


// /**
//  * Remove all the handlers of specified category and topic
//  */
// private removeEventListener(sessionId: string, category: string, topic?: string) {
//   if (!this.eventHandlers[connectionId]) return;
//
//   for (let EventHandlerItemIndex in this.eventHandlers[connectionId]) {
//     const EventHandlerItem = this.eventHandlers[connectionId][EventHandlerItemIndex];
//     if (
//       category === EventHandlerItem[HANDLER_ITEM_POS.category]
//       && topic === EventHandlerItem[HANDLER_ITEM_POS.topic]
//     ) {
//       this.removeHandler(EventHandlerItem);
//
//       // T-O-D-O: strongly test
//       this.eventHandlers[connectionId].splice(Number(EventHandlerItemIndex), 1);
//     }
//   }
// }
