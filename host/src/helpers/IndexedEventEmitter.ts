//import * as EventEmitter from 'eventemitter3';


type EventHandler = () => void;


export class IndexedEventEmitter {
  //private events: EventEmitter = new EventEmitter();
  private handlers: EventHandler[] = [];


  constructor() {
    //this.events = new EventEmitter();
  }


  emit(eventName: string, ...args: any[]) {
    //this.events.emit(eventName, args);

    //for (var )
  }

  addEventListener(eventName: string, handler: EventHandler): number {
    const index = this.handlers.length;

    this.handlers.push(handler);

    return index;
  }

  removeEventListener(eventName: string, handlerId) {

  }

}
