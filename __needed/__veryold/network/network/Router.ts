import IndexedEvents from '../../../../../squidlet-lib/src/IndexedEvents';
import Network from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/network';
import DriverEnv from '../../system/baseDrivers/DriverEnv';
import Destinations from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/network/Destinations';
import RouterMessage from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/network/interfaces/RouterMessage';
import Destination from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/network/interfaces/Destination';
import {lastItem} from '../../../../../squidlet-lib/src/arrays';


type RouterHandler = (error: Error | null, payload?: any) => void;


/**
 * It passes messages to corresponding connection by `message.to`.
 * And receives messages from all the available connections on current host.
 * It forwards message to next host if current host one of host on route
 */
export default class Router {
  private readonly network: Network;
  private readonly driverEnv: DriverEnv;
  private _destinations?: Destinations;
  private readonly msgEvents = new IndexedEvents<RouterHandler>();

  private get destinations(): Destinations {
    return this._destinations as Destinations;
  }

  constructor(network: Network, driverEnv: DriverEnv) {
    this.network = network;
    this.driverEnv = driverEnv;
  }

  init(): void {
    this._destinations = new Destinations(
      this.driverEnv,
      this.network.config.connections,
      this.network.config.neighbors
    );

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
  listenIncome(handler: RouterHandler): number {
    return this.msgEvents.addListener(handler);
  }

  removeListener(handlerIndex: number): void {
    this.msgEvents.removeListener(handlerIndex);
  }

  /**
   * Handle all the messages from remote hosts which sent to this host or via this host.
   */
  private handleIncomeMessages = (error: Error | null, routerMessage?: RouterMessage): void => {
    if (error) {
      this.msgEvents.emit(error);

      return;
    }
    if (!routerMessage) {
      this.msgEvents.emit(new Error(`RouterMessage is undefined`));

      return;
    }

    // if it's final destination - pass message to income listeners
    if (lastItem(routerMessage.route) === this.network.hostId) {
      this.msgEvents.emit(null, routerMessage.payload);

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
      .catch((err) => this.msgEvents.emit(err));
  }

  /**
   * Try to find the next host after current.
   * For example we have route [ 'fromHost', 'currentHost', 'nextHost' ]
   *   * first we found current host
   *   * and the next one will be result
   */
  private resolveNextHostId(route: Array<string>): string {
    if (route.length < 2) throw new Error(`Incorrect route ${JSON.stringify(route)}`);
    if (lastItem(route) === this.network.hostId) {
      throw new Error(`Incorrect route ${JSON.stringify(route)} current host ${this.network.hostId} is the last`);
    }

    const theNextHostShift = 1;

    // go to next point
    if (route.length === 2) {
      return route[theNextHostShift];
    }

    const myIndex: number = route.indexOf(this.network.hostId);

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
