import * as _ from 'lodash';
import * as EventEmitter from 'events';

import Network from './Network';
import Drivers from '../app/Drivers';
import Destinations from './Destinations';
import RouterMessage from './interfaces/RouterMessage';
import Destination from './interfaces/Destination';


type RouterHandler = (error: Error | null, payload?: any) => void;


/**
 * It passes messages to corresponding connection by `message.to`.
 * And receives messages from all the available connections on current host.
 * It forwards message to next host if current host one of host on route
 */
export default class Router {
  private readonly network: Network;
  private readonly drivers: Drivers;
  private readonly destinations: Destinations;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'msg';

  constructor(network: Network, drivers: Drivers) {
    this.network = network;
    this.drivers = drivers;
    this.destinations = new Destinations(
      this.drivers,
      this.network.config.connections,
      this.network.config.neighbors
    );
  }

  init(): void {
    this.destinations.init();
    // listen for income messages from all the hosts
    this.destinations.listenIncome(this.handleIncomeMessages);
  }

  async send(toHost: string, payload: any): Promise<void> {
    if (toHost === this.network.hostId) throw new Error(`You can't send message to yourself`);

    const routerMessage: RouterMessage = this.generateMessage(toHost, payload);
    const nextHostId: string = this.resolveNextHostId(routerMessage.route);
    const nextHostConnectionParams: Destination = this.resolveDestination(nextHostId);

    await this.destinations.send(nextHostConnectionParams, routerMessage);
  }

  /**
   * Listen for income messages which is delivered to this final host.
   */
  listenIncome(handler: RouterHandler): void {
    this.events.addListener(this.eventName, handler);
  }

  removeListener(handler: RouterHandler): void {
    this.events.removeListener(this.eventName, handler);
  }

  /**
   * Handle all the messages from remote hosts which sent to this host or via this host.
   */
  private handleIncomeMessages = (error: Error | null, routerMessage?: RouterMessage): void => {
    if (error) {
      this.events.emit(this.eventName, error);

      return;
    }
    if (!routerMessage) {
      this.events.emit(this.eventName, `RouterMessage is undefined`);

      return;
    }

    // if it's final destination - pass message to income listeners
    if (_.last(routerMessage.route) === this.network.hostId) {
      this.events.emit(this.eventName, null, routerMessage.payload);

      return;
    }

    // else forward message to next host on route
    const newRouterMessage = {
      ...routerMessage,
      ttl: routerMessage.ttl - 1,
    };
    const nextHostId: string = this.resolveNextHostId(newRouterMessage.route);
    const nextHostConnectionParams: Destination = this.resolveDestination(nextHostId);

    this.destinations.send(nextHostConnectionParams, newRouterMessage)
      .catch((err) => this.events.emit(this.eventName, err));
  }

  /**
   * Try to find the next host after current.
   * For example we have route [ 'fromHost', 'currentHost', 'nextHost' ]
   *   * first we found current host
   *   * and the next one will be result
   */
  private resolveNextHostId(route: Array<string>): string {
    if (route.length < 2) throw new Error(`Incorrect route ${JSON.stringify(route)}`);
    if (_.last(route) === this.network.hostId) {
      throw new Error(`Incorrect route ${JSON.stringify(route)} current host ${this.network.hostId} is the last`);
    }

    const theNextHostShift = 1;

    // go to next point
    if (route.length === 2) {
      return route[theNextHostShift];
    }

    const myIndex = _.indexOf(route, this.network.hostId);

    if (myIndex < 0) {
      throw new Error(`Can't find my hostId "${this.network.hostId}" in route ${JSON.stringify(route)}`);
    }

    return route[myIndex + theNextHostShift];
  }

  private resolveDestination(hostId: string): Destination {
    const params: Destination = this.network.config.neighbors[hostId];

    if (!params) throw new Error(`Can't find destination connection params of host "${hostId}"`);

    return params;
  }

  private generateMessage(toHost: string, payload: any): RouterMessage {
    if (!this.network.config.routes[toHost]) {
      throw new Error(`Can't find route to "${toHost}"`);
    }

    const route: Array<string> = this.network.config.routes[toHost];

    return {
      route,
      ttl: this.network.config.params.routedMessageTTL,
      payload,
    };
  }

}
