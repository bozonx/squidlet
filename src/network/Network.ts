import Router from './Router';
import Drivers from '../app/Drivers';
import HostNetworkConfig from './interfaces/HostNetworkConfig';


/**
 * Network connection manager.
 * It works independent.
 */
export default class Network {
  readonly hostId: string;
  readonly config: HostNetworkConfig;

  private readonly drivers: Drivers;
  private readonly router: Router;

  constructor(drivers: Drivers, hostId: string, config: HostNetworkConfig) {
    this.hostId = hostId;
    this.config = config;
    this.drivers = drivers;
    this.router = new Router(this, this.drivers);
  }

  init(): void {
    this.router.init();
  }

  async send(toHost: string, payload: any): Promise<void> {

    // TODO: можеть на всякий случай ждать таймаут чтобы не было зависших запросов ?

    return this.router.send(toHost, payload);
  }

  listenIncome(handler: (payload: any) => void): void {
    this.router.listenIncome(handler);
  }

  removeListener(handler: (payload: any) => void): void {
    this.router.removeListener(handler);
  }

}
