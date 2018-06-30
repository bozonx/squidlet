import App from '../app';
import Devices from "../app/Devices";
//import * as EventEmitter from 'events';

/**
 * Publisher uses for publish and subscribe for external messages.
 * It usually works with MQTT broker.
 * It provides interface to publish result and receive actions calls for devices.
 * Publisher works only on master!
 */
export default class Publisher {

  // TODO: может это всетаки mqtt-client plugin ????

  private readonly system: System;
  //private readonly events: EventEmitter = new EventEmitter();

  constructor(app) {
    this.system = system;
  }


  //const deviceTopic = deviceId.replace(/\./g, '/');


  async publish(topic: string, params: Array<any>) : Promise<void> {
    //this.events.emit(topic, params);

    // TODO: если приходит внешнее соощение из mqtt брокера - значит это вызов action девайса
    // TODO: надо вызвать this.system.devices.callAction(...)
    // TODO: но поидее могут быть и какие-то системные вызовы???
  }

  subscribe(topic: string, handler: (...args: any[]) => void) {
    //this.events.addListener(topic, handler);

    // TODO: слушаем результат - status, config и тд
    // TODO: надо вызвать this.system.listenStatus или listenConfig или общуу ф-ю - listen
  }

}
