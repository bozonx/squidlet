import * as _ from 'lodash';
import * as EventEmitter from 'events';

import App from '../app';
import Destinations from './Destinations';
import RouterMessage from './interfaces/RouterMessage';
import Destination from './interfaces/Destination';


/**
 * It passes messages to corresponding connection by `message.to`.
 * And receives messages from all the available connections on current host.
 * It forwards message to next host if current host one of host on route
 */
export default class Router {
  private readonly app: App;
  private readonly destinations: Destinations;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'msg';

  constructor(app: App) {
    this.app = app;
    this.destinations = new Destinations(this.app.drivers, _.map(this.app.host.config.neighbors));
  }

  init(): void {
    this.destinations.init();
    // listen for income messages from all the hosts
    this.destinations.listenIncome(this.handleIncomeMessages);
  }

  async send(toHost: string, payload: any): Promise<void> {
    if (toHost === this.app.host.id) throw new Error(`You can't send message to yourself`);

    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной

    const routerMessage: RouterMessage = this.generateMessage(toHost, payload);
    const nextHostId: string = this.resolveNextHostId(routerMessage.route);
    const nextHostConnectionParams: Destination = this.resolveDestination(nextHostId);

    await this.destinations.send(nextHostConnectionParams, routerMessage);
  }

  /**
   * Listen for income messages which is delivered to this final host.
   */
  listenIncome(handler: (payload: any) => void) {
    this.events.addListener(this.eventName, handler);
  }

  off(handler: (payload: any) => void) {
    this.events.removeListener(this.eventName, handler);
  }

  /**
   * Handle all the messages from remote hosts which sent to this host or via this host.
   */
  private handleIncomeMessages = (routerMessage: RouterMessage): void => {
    // if it's final destination - pass message to income listeners
    if (_.last(routerMessage.route) === this.app.host.id) {
      this.events.emit(this.eventName, routerMessage.payload);

      return;
    }

    // else forward message to next host on route

    const nextHostId: string = this.resolveNextHostId(routerMessage.route);
    const nextHostConnectionParams: Destination = this.resolveDestination(nextHostId);

    this.destinations.send(nextHostConnectionParams, routerMessage)
      .catch((err) => {
        // TODO: что делать с ошибкой???
      });
  };

  /**
   * Try to find the next host after current.
   * For example we have route [ 'fromHost', 'currentHost', 'nextHost' ]
   *   * first we found current host
   *   * and the next one will be result
   */
  private resolveNextHostId(route: Array<string>): string {
    if (route.length < 2) throw new Error(`Incorrect route ${JSON.stringify(route)}`);
    if (_.last(route) === this.app.host.id) {
      throw new Error(`Incorrect route ${JSON.stringify(route)} current host ${this.app.host.id} is the last`);
    }

    const theNextHostShift = 1;

    // go to next point
    if (route.length === 2) {
      return route[theNextHostShift];
    }

    const myIndex = _.indexOf(route, this.app.host.id);

    if (myIndex < 0) {
      throw new Error(`Can't find my hostId "${this.app.host.id}" in route ${JSON.stringify(route)}`);
    }

    return route[myIndex + theNextHostShift];
  }

  private resolveDestination(hostId: string): Destination {
    const params: Destination = this.app.host.config.neighbors[hostId];

    if (!params) throw new Error(`Can't find destination connection params of host "${hostId}"`);

    return params;
  }

  private generateMessage(toHost: string, payload: any): RouterMessage {
    if (!this.app.host.config.routes[toHost]) {
      throw new Error(`Can't find route to "${toHost}"`);
    }

    const route: Array<string> = this.app.host.config.routes[toHost];

    return {
      route,
      ttl: this.app.host.config.host.routedMessageTTL,
      payload,
    };
  }

}
